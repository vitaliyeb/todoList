const http = require('http');
const fs = require('fs');
const URL = require('url');

const router = function() {
    return {
        countPath: (request)=> {
            return URL.parse(request.url).pathname;
        },
        retPage: function(request) {
            return dynamically.retContent(fs.readFileSync(`./dist${this.countPath(request)}.html`, "utf8"));
        }
    }
}();

const VitDB = function () {
    let createDayTusk =  function (obj) {
        this.date = obj.currentDate;
        this.tusk = ["obj.tusk"];
    }
    return {
        readVDB: function (){
            return fs.readFileSync(`./dist/VitDateBase.txt`, 'utf8');
        },
        DBInit: function (req, res) {
            if(req.method === "GET"){
                let arrVDB = JSON.parse(this.readVDB());
                let currentItem = arrVDB.find((item)=> item.date == req.headers.getdate);
                if(!!currentItem){
                    return this.retResponse(res, JSON.stringify(currentItem))
                }
                    return this.retResponse(res);
            }else if(req.method === 'POST'){
                let data = '';
                req.on('data', (chunk)=> {
                    data+=chunk;
                });
                req.on('end', ()=>{
                    data = JSON.parse(data);
                    let arrVDB = Array.from(JSON.parse(this.readVDB()));
                    let currentItem = arrVDB.find((item)=> item.date == data.currentDate);
                    if(!currentItem){
                        arrVDB.push(new createDayTusk(data));
                    }else {
                        currentItem.tusk.push(data.newTusk);
                    }
                    fs.writeFileSync(`./dist/VitDateBase.txt`, JSON.stringify(arrVDB));
                    this.retResponse(res);
                });
            }
        },
        retResponse: function (response, data = '{"tusk":["У вас нет задач на сегодня", "У вас нет задач на сегодня"]}') {
            response.write(data);
            response.end();
        }

    }
}();

const dynamically = function() {
    return {
        retContent: function (main) {
            return main.replace(/[{{]{2}.+?[}}]{2}/ig, (match)=> this.getBlock(match.match(/(?<=[{{]{2}).+?(?=[}}]{2})/ig)));
        },
        getBlock: (nameBlock)=> {
            return fs.readFileSync(`./dist/blockContent/${nameBlock}.html`, `utf8`);
        }
    }
}();



const server = http.createServer((request, response)=>{
    if(!request.headers.referer){
        response.write(router.retPage(request));
        response.end();
    }else {
        VitDB.DBInit(request, response);
});

server.listen({
    port: 8080,
    host: '127.168.0.1'
})


