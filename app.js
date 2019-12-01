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
    let createDayTusk =  function (obj, date) {
        this.date = date;
        this.tusk = [obj];
    }
    return {
        readVDB: function (){
            return fs.readFileSync(`./dist/VitDateBase.txt`, 'utf8');
        },
        DBInit: function (req, res) {
            if(req.method === "GET"){
                let arrVDB = JSON.parse(this.readVDB());
                let currentItem = arrVDB.find((item)=> item.date == req.headers.gettuskday);
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
                    let arrVDB = Array.from(JSON.parse(this.readVDB())),
                        currentDayInex = 0,
                        currentItem = arrVDB.find((item, i)=> {
                            currentDayInex = i;
                            return item.date == data.reqDate
                        });

                    switch (data.do) {
                        case 'addTusk':
                            if(!!currentItem){
                                currentItem.tusk.push(data.tusk);
                            }else{
                                arrVDB.push(new createDayTusk(data.tusk, data.reqDate))
                            }
                            break;
                        case 'clear':
                            if(!!currentItem) arrVDB.splice(currentDayInex, 1);
                            break;
                        case 'deletedTusk':
                            if(!!currentItem) currentItem.tusk.splice(data.index, 1);
                            break;
                        case 'isDone':
                            if(!!currentItem) currentItem.tusk[data.index].done = data.done;
                            break;
                    }
                    fs.writeFileSync(`./dist/VitDateBase.txt`, JSON.stringify(arrVDB));
                    this.retResponse(res);
                });
            }
        },
        retResponse: function (response, data = '{"tusk":[{"defaulted": true}]}') {
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
