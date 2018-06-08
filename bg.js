chrome.runtime.onInstalled.addListener(() => {
	chrome.contextMenus.create({
		title: 'Attempt to open image in new tab',
		contexts: ['page', 'frame', 'selection', 'link', 'image',
			'video', 'audio', 'editable'],
	})
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
	// click = open image in new tab
	let opts = {frameId: 0}
	if(info.frameId) {
		opts.frameId = info.frameId
	}
	chrome.tabs.sendMessage(tab.id, {}, opts, resp => {
		if(resp) {
			console.log('Opening a new tab: ' + resp.url)
			chrome.tabs.create({
				url: resp.url,
				// matches up with regular "open in new tab"
				// behavior
				active: false
			})
		}
	})
})
