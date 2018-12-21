import test from 'ava'

//let iuc = require('./image-under-cursor')
import iuc from './image-under-cursor'

var u = 'linear-gradient(90deg, rgba(0, 0, 0, 0.4), transparent 60%, transparent), url("https://uploads-ssl.webflow.com/5939ede8909efb3cae8aa083/59ee8ac0d4a0dd000157a4a1_desktop.jpg")'

test('regular url', t => {
	t.is(iuc.extractURL('url("https://example.com/desktop.jpg")'), 'https://example.com/desktop.jpg')
	t.is(iuc.extractURL('x'), undefined)
	t.is(iuc.extractURL('url(x'), undefined, 'unclosed url parens')
	t.is(iuc.extractURL('url(xyz)'), 'xyz')
	t.is(iuc.extractURL('URL(xyz)'), 'xyz')
	t.is(iuc.extractURL('UrL(xyz)'), 'xyz')
	t.is(iuc.extractURL('UL(xyz)'), undefined)
})

test('quoted url escapes', t => {
	t.is(iuc.extractURL('url("\\1234")'), '\u1234')
	t.is(iuc.extractURL('url("\\"")'), '"')
	t.is(iuc.extractURL("url('\\'')"), '\'')
	t.is(iuc.extractURL("url('\\\r\n')"), '\r\n')
})

test('unquoted url escapes', t => {
	t.is(iuc.extractURL('url(xyz\\()'), 'xyz(')
	t.is(iuc.extractURL('url(\\1234 abc)'), '\u1234abc')
	t.is(iuc.extractURL('url()'), '')
	t.is(iuc.extractURL('url(\\\\f)'), '\\f')
	t.is(iuc.extractURL('url(xyz\\)'), 'xyz\f')
})

test('parseEscape', t => {
	t.deepEqual(iuc.parseEscape('\r\n'), ['\r\n'])
	t.deepEqual(iuc.parseEscape('\r'), ['\r'])
	t.deepEqual(iuc.parseEscape('\n'), ['\n'])
})
