document.addEventListener('contextmenu', e => {
	lastContextClick = { x: e.clientX, y: e.clientY, target: e.target }
})

var lastContextClick = { x: NaN, y: NaN, target: undefined }

let isURL = url => url.startsWith('url(')

// e.g. url = url("https://78.media.tumblr.com/avatar_bdf460ee0a4a_128.pnj")
// https://developer.mozilla.org/en-US/docs/Web/CSS/url
let trimURL = url => {
	if(! isURL(url)) {
		return undefined
	}

	return url.substring(4, url.length - 1).replace(/^["']|["']$/g, '')
}

let bgURL = el => {
	var url
	while(el && !url) {
		url = trimURL(el.style.backgroundImage)
		el = el.parentElement
	}

	if(url)
		console.log(url)

	return url
}

let area = img => img.naturalHeight * img.naturalWidth

// https://stackoverflow.com/a/4020842
let largest = imgs => imgs.reduce((biggest, img) => {
	if(area(biggest) <= area(img)) {
		return img
	} else {
		return biggest
	}
})

let containDistance = (parentEl, el) => {
	var n = 0
	while(parentEl) {
		if(parentEl.contains(el)) {
			return n
		}
		n += 1
		parentEl = parentEl.parentElement
	}
	return Infinity
}

let closest = (target, imgs) => {
	var lowest = Infinity
	var ret = []
	var dist = Infinity
	for(img of imgs) {
		// lower is closer
		dist = containDistance(target, img)
		if(dist == lowest) {
			ret.push(img)
		} else if(dist < lowest) {
			ret = [img]
			lowest = dist
		}
	}
	return ret
}

let between = (v, x, y) => x <= v && y >= v
let inRect = o => between(o.point.x, o.rect.x, o.rect.x + o.rect.width) &&
	between(o.point.y, o.rect.y, o.rect.y + o.rect.height)
let mouseIsInside = el => inRect({
	point: lastContextClick,
	rect: el.getBoundingClientRect()
})

function clicked() {
	candidates = []
	for(img of document.images) {
		if(mouseIsInside(img)) {
			candidates.push(img)
		}
	}

	var ret = undefined
	if(candidates.length === 0) {
		// sometimes websites (tumblr) are nasty and place their images
		// (profile pictures on the default theme) in background urls.
		// i dont know why. maybe just to cause me problems?
		//
		// here we dig through the css looking for an answer
		ret = bgURL(lastContextClick.target)
	} else {
		// get closest image to candidates we found
		ret = largest(closest(lastContextClick.target, candidates)).src
	}

	if(ret === undefined) {
		// bgURL *might* have found an image so we only *might* have to
		// call this
		console.log('No images found under your cursor')
		noneFound()
	} else {
		// im keeping these in tbh
		console.log('Found an image under your cursor: ' + ret)
		ret = {url: ret}
	}

	lastContextClick = { x: NaN, y: NaN, target: undefined }
	return ret
}

function noneFound() {
	let el = document.createElement('div')
	el.innerHTML = 'no images found!'
	el.style.cssText = 'background: #900; color: #fff; padding: 25px; position: fixed; top: 50px; left: 50%; transform: translateX(-50%); z-index: 999999; font: bold 24px sans-serif; transition: 1.5s;'
	document.body.prepend(el)
	window.setTimeout(() => el.style.opacity = 0, 500)
	window.setTimeout(() => el.remove(), 2000)
}

chrome.runtime.onMessage.addListener((msg, sender, respond) => {
	respond(clicked())
})
