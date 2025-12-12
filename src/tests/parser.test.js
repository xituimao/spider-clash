import { test } from 'node:test';
import assert from 'node:assert';
import { extractLinks, decodeSubscription, parseNode } from '../parser.js';
import { Buffer } from 'buffer';

test('extractLinks should find vmess links', (t) => {
    const text = 'Some text here vmess://eydhZGQnOiAnMTI3LjAuMC4xJ30= and more text';
    const links = extractLinks(text);
    assert.strictEqual(links.length, 1);
    assert.strictEqual(links[0], 'vmess://eydhZGQnOiAnMTI3LjAuMC4xJ30=');
});

test('decodeSubscription should decode base64', (t) => {
    const raw = 'vmess://abc\nvmess://def';
    const base64 = Buffer.from(raw).toString('base64');
    const links = decodeSubscription(base64);
    assert.strictEqual(links.length, 2);
    assert.strictEqual(links[0], 'vmess://abc');
});

test('parseNode should parse vmess json', (t) => {
    const config = { add: '1.2.3.4', port: 443, ps: 'test', id: 'uuid', net: 'ws', tls: 'tls' };
    const base64 = Buffer.from(JSON.stringify(config)).toString('base64');
    const link = `vmess://${base64}`;
    
    const node = parseNode(link);
    assert.strictEqual(node.type, 'vmess');
    assert.strictEqual(node.add, '1.2.3.4');
    assert.strictEqual(node.port, 443);
});
