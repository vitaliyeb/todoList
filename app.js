const http = require('http');
const fs = require('fs');
const URL = require('url');

const router = function() {
    return {
        countPath: (request)=> {
            return URL.parse(request.url).pathname;
        },
        retPage: function(request) {
            try {
                fs.statSync(`./dist${this.countPath(request)}.html`);
            }
            catch (err) {
                return dynamically.retContent(fs.readFileSync(`./dist/notPage.html`, "utf8"));
            }
            return dynamically.retContent(fs.readFileSync(`./dist${this.countPath(request)}.html`, "utf8"));
        }
    }
}();

const VitDB = function () {
    let createDayTusk =  function (obj) {
        this.date = obj.currentDate;
        this.tusk = [obj.newTusk];
        this.done = false;
    }
    return {
        readVDB: function (){
            return fs.readFileSync(`./dist/VitDateBase.txt`, 'utf8');
        },
        DBInit: function (req, res) {
            if(req.method === "GET"){
                let arrVDB = JSON.parse(this.readVDB());
                let currentItem = arrVDB.find((item)=> item.date == req.headers.getdate);
                if(!!currentItem && !!currentItem.tusk.length){
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

                    if(data.do == 'isDone'){
                            currentItem.tusk[data.id].done = data.done;
                     }else if(data.do == 'delete'){
                            currentItem.tusk.splice(data.id, 1);
                    }else if(data.do == 'clear'){
                        arrVDB.splice(arrVDB.indexOf(currentItem), 1);
                    }else{
                        if(!currentItem){
                            arrVDB.push(new createDayTusk(data));
                        }else {
                            currentItem.tusk.push(data.newTusk);
                        }
                    }
                    fs.writeFileSync(`./dist/VitDateBase.txt`, JSON.stringify(arrVDB));
                    this.retResponse(res);
                });
            }
        },
        retResponse: function (response, data = '{"tusk":[{"text":"У вас нет задач на этот день", "defaulted": true}]}') {
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
}});

server.listen(8080, '127.168.0.1', () => {
    console.log(`Server running at http://127.168.0.1:8080/index`);
});
