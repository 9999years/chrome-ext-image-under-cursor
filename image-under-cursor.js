var lastContextClick = { x: NaN, y: NaN, target: undefined }

// https://www.w3.org/TR/css-syntax-3/#url-token-diagram
// self-invoking fn doesn't pollute the global namespace with a bunch of strings
let urlRe        = new RegExp((() => {
	let wsChars      = `\r\n\f\t `
	let whitespace   = `[\n\f\t ]|\r\n?`
	let newline      = `[\n\f]|\r\n?`
	let nlChars      = `\n\f\r`
	let ws           = `[${wsChars}]*`

	let nonPrintable = `\x00-\x08\x0b\x0e-\x1f\x7f`
	let hexDigit     = `0-9a-fA-F`
	let notNLorHex   = `[^${hexDigit}${nlChars}]`
	let escapeToken  = `\\\\(?:[${hexDigit}]{1,6}(?:${whitespace})?|${notNLorHex})`

	// OK ≈ doesnt need escaping
	let stringNotOK  = `\\${nlChars}`
	let stringTokens = quotes => `(?:[^${quotes}${stringNotOK}]|${escapeToken}|\\${newline})*`
	let stringToken  = `"${stringTokens('"')}"|'${stringTokens("'")}'`

	let urlOK        = `[^\\"'()\\${wsChars}${nonPrintable}]`
	let urlUnquoted  = `(?:${urlOK}|${escapeToken})*`
	return `url\\(${ws}(${urlUnquoted}|${stringToken})${ws}\\)`
})())

let parseEscape = str => {

	let newlineStr   = `[\n\f]|\r\n?`
	let newline      = new RegExp(`^(?:${newlineStr})`) //!

	let hexDigit     = `0-9a-fA-F`
	let partialHexEsc = new RegExp((() => {
		let whitespace = `[\n\f\t ]|\r\n?`
		return `^([${hexDigit}]{1,6})(?:${whitespace})?`
	})())

	if((tok = newline.exec(str)) !== null) {
		// consume nl
		console.log(`found NL escape`)
		return [tok[0]]
	} else if((tok = partialHexEsc.exec(str)) !== null) {
		console.log(`found hex escape ${tok[1]}`)

		// 1--6 hex digits, optional single ws token
		// ws tok = space | \t | nl
		//        = [\r\n\t\f ]|\r\n
		return [String.fromCodePoint(Number.parseInt(tok[1], 16)),
			tok[0].length]
	} else {
		// literal char
		console.log(`found escaped literal ${str[0]}`)
		return [str[0]]
	}
}

let parseUnquotedURL = str => {
	// str := urlOK | escape
	let ret = []
	let consume = (tok, amt) => {
		if(tok) {
			console.log(`consuming: \`${tok}\``)
			ret.push(tok)
		}
		if(amt === undefined) {
			amt = tok.length
		}
		if(amt > 0) {
			console.log(`skipping first ${amt} chars of string`)
			str = str.substring(amt)
			console.log(`str: \`${str}\``)
		}
	}

	let nonPrintable = `\x00-\x08\x0b\x0e-\x1f\x7f`
	let wsChars      = `\r\n\f\t `
	let urlOK        = new RegExp(`^[^\\"'()\\${wsChars}${nonPrintable}]+`)

	console.log(`parsing: ${str}`)
	// make sure these regex are from the start of the string
	for(var i = 0; i < str.length; ) {
		if((tok = urlOK.exec(str)) !== null) {
			console.log(`found OK chars ${tok[0]}`)
			consume(tok[0])
		} else if(str[0] === '\\') {
			// consume backslash
			consume('', 1)
			console.log('consuming \\')
			var [tok, amt] = parseEscape(str)
			consume(tok, amt)
		}
	}

	return ret.join('')
}

let parseQuotedString = str => {
	let quote = str[0]
	// trim front / end quote
	str = str.substring(1, str.length - 1)
	// quote (string stuff) quote
	// string stuff is:
	// * regular chars (not nls, quotes, or backslashes)
	// * escapes
	// * backslash + newline
	let ret = []
	let consume = (tok, amt) => {
		if(tok) {
			console.log(`consuming: \`${tok}\``)
			ret.push(tok)
		}
		if(amt === undefined) {
			amt = tok.length
		}
		if(amt > 0) {
			console.log(`skipping first ${amt} chars of string`)
			str = str.substring(amt)
			console.log(`str: \`${str}\``)
		}
	}


	let newlineStr   = `[\n\f]|\r\n?`
	let nlChars      = `\n\f\r`
	let hexDigit     = `0-9a-fA-F`

	let newline      = new RegExp(`^(?:${newlineStr})`) //!
	let partialHexEsc = new RegExp((() => {
		let whitespace = `[\n\f\t ]|\r\n?`
		return `^([${hexDigit}]{1,6})(?:${whitespace})?`
	})())

	//let stringOK = new RegExp((() => {
		//let notNLorHex   = `[^${hexDigit}${nlChars}]`
		//let escapeToken  = `\\\\(?:${partialHexEsc}|${notNLorHex})`
		//// OK ≈ doesnt need escaping
		//let stringToken = quotes => `(?:[^${quotes}${stringNotOK}]|${escapeToken}|\\${newlineStr})`


		//return `^${stringToken(quote)}+`
	//})()) //!

	let stringOK = new RegExp(`^[^${quote}${nlChars}\\\\]+`)

	console.log(`parsing: ${str}`)
	// make sure these regex are from the start of the string
	for(var i = 0; i < str.length; ) {
		if((tok = stringOK.exec(str)) !== null) {
			console.log(`found OK chars ${tok[0]}`)
			consume(tok[0])
		} else if(str[0] === '\\') {
			// consume backslash
			consume('', 1)
			console.log('consuming \\')
			var [tok, amt] = parseEscape(str)
			consume(tok, amt)
		}
	}

	console.log('----------------')

	return ret.join('')
}

// e.g. url = url("https://78.media.tumblr.com/avatar_bdf460ee0a4a_128.pnj")
// https://developer.mozilla.org/en-US/docs/Web/CSS/url
let extractURL = url => {
	let match = urlRe.exec(url)
	if(match === null) {
		// definitely not!
		return undefined
	}

	// first group; unquoted or string
	url = match[1]
	if(url[0] === '"' || url[0] === '\'') {
		// quoted string
		return parseQuotedString(url)
	} else {
		// unquoted url
		return parseUnquotedURL(url)
	}
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

if (typeof exports !== 'undefined') {
	// unit tests
	exports.extractURL = extractURL
} else {
	// when you use it
	document.addEventListener('contextmenu', e => {
		lastContextClick = { x: e.clientX, y: e.clientY, target: e.target }
	})

	chrome.runtime.onMessage.addListener((msg, sender, respond) => {
		respond(clicked())
	})
}
