const fs = require('fs');
const path = require('path');
const Koa = require('koa');
const app = new Koa();
const PATH = './resource';
let opn = require('opn')


app.use(async ctx => {
    console.log(ctx.path)
    if(ctx.path === '/index.html') {
        ctx.body = " <video width='500px' height='500px' src='http://localhost:3001/test.mp4' controls='controls'></video><audio id='musicPlayer' src='http://localhost:3001/source.mp3' controls></audio>"
    }else {
        const file = path.join(__dirname, `${PATH}${ctx.path}`);
        // 1、404检查
        try {
            fs.accessSync(file);
        } catch (e) {
            return ctx.response.status = 404;
        }
        const method = ctx.request.method;
        const { size } = fs.statSync(file);
        // 2、响应head请求，返回文件大小
        if ('HEAD' == method) {
            return ctx.set('Content-Length', size);
        }
        const range = ctx.headers['range'];
        // 3、通知浏览器可以进行分部分请求
        if (!range) {
            return ctx.set('Accept-Ranges', 'bytes');
        }
        const { start, end } = getRange(range);
        // 4、检查请求范围
        if (start >= size || end >= size) {
            ctx.response.status = 416;
            return ctx.set('Content-Range', `bytes */${size}`);
        }
        // 5、206分部分响应
        ctx.response.status = 206;
        ctx.set('Accept-Ranges', 'bytes');
        ctx.set('Content-Range', `bytes ${start}-${end ? end : size - 1}/${size}`);
        ctx.body = fs.createReadStream(file, { start, end });
        ctx.body.on('close',() => {
            console.log('关闭连接')
        })
        ctx.body.on('ready',() => {
            console.log('准备ok')
        })
        ctx.body.on('open',() => {
            console.log('open状态')
        })
    }
});

app.listen(3001, () => {
    console.log('服务器开启！')
    opn('http://localhost:3001/index.html')
});
function getRange(range) {
    var match = /bytes=([0-9]*)-([0-9]*)/.exec(range);
    const requestRange = {};
    if (match) {
        if (match[1]) requestRange.start = Number(match[1]);
        if (match[2]) requestRange.end = Number(match[2]);
    }
    return requestRange;
}