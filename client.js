import request from 'request';
import path from 'path';
import fs from 'fs';

const SINGLE = 1024 * 1000; // 分片每一片的大小1MB
const SOURCE = 'http://127.0.0.1:3001/source.mp3'; // 服务器资源的地址

request({
    method: 'HEAD',
    uri: SOURCE,
}, (err, res) => {
    if (err) return console.error(err);
    // 文件写入的目录
    const file = path.join(__dirname, './download/source.mp3');
    try {
        fs.closeSync(fs.openSync(file, 'w'));
    } catch (err) {
        return console.error(err);
    }
    // 获取文件的长度
    const size = Number(res.headers['content-length']);

    // 获取分片片段数量
    const length = parseInt(size / SINGLE);

    for (let i = 0; i <= length; i++) {
        let start = i * SINGLE;
        let end = i === length ? size - 1 : (i + 1) * SINGLE - 1;
        request({
            method: 'GET',
            uri: SOURCE,
            headers: {
                'range': `bytes=${start}-${end}`
            },
        }).on('response', (resp) => {
            const range = resp.headers['content-range'];
            const match = /bytes ([0-9]*)-([0-9]*)/.exec(range);
            start = match[1];
            end = match[2];
            console.log('下载范围：' + start + '-' + end)
        }).pipe(fs.createWriteStream(file, {start, end}));
    }
});