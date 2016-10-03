const express = require('express');
const router = express.Router();
var conString = "postgres://khoa:123456@localhost:5435/photobook";
const pg = require('pg');
const fs = require('fs');

const formidable = require('formidable'), http = require('http'), util = require('util');

//GET: lấy toàn bộ danh sách các actor
router.get('/photo', function (req, res) {
    pg.connect(conString, function (err, client, done) {
        if (err) {
            res.end('error fetching client from pool');
            return;
        }
        client.query('SELECT id, title, path FROM photo;',
            function (err, result) {
                done();
                if (err) {
                    res.end('Error when querying');
                    return;
                }
                res.json(result.rows);
            });
    });
});

//POST: Tạo một bản ghi
router.post('/photo', function (req, res) {
    res.writeHead(200, {'content-type': 'text/plain'});
    var form = new formidable.IncomingForm();
    var postLastPath = __dirname.lastIndexOf('/');
    var rootDir = __dirname.substring(0, postLastPath);
    console.log(rootDir);


    form.uploadDir = rootDir + "/public/photos/";
    //form.keepExtensions = true;
    form.parse(req, function(err, fields, files) {
        //res.end(util.inspect({fields: fields, files: files}));
        //console.log(fields.title);
        //console.log(files.photo.path);
        //console.log(files.photo.name);

        console.log(fields);
        console.log(files);

        pg.connect(conString, function (err, client, done) {

            if (err) {
                res.end('error fetching client from pool');
                return;
            }
            client.query('INSERT INTO photo (title, path) VALUES ($1, $2) RETURNING id',
                [fields.name, "/photos/_" + files.photo.path], function (err, result) {
                    done();
                    if (err) {
                        res.end('error when insert to database');
                    } else {
                        //Get return ID from INSERT command
                        console.log(result);
                        var newPath = form.uploadDir + result.rows[0].id + "_" + files.photo.name;
                        fs.rename(files.photo.path, newPath, function (err) {
                            if (err) {
                                res.end('cannot rename file ' + files.photo.path);
                            }
                        });
                        res.end('success');
                    }
                });
        });

        res.end('Done');
    });
});

module.exports = router;