#!/usr/bin/env node
/*jshint node:true, strict:false */

var util = require('util');
var fs = require('fs');
var csv = require('csv');
var argv = require('minimist')(process.argv.slice(2));

// CSV COLUMNS: "Forum Name","Category Name","Topic Title","Permalink","Posted Time","Content","Author","Attachments","Votes"

var filename = argv.file || argv.f;

var output = [];
var parser = csv.parse({delimiter: ','});
var input = fs.createReadStream(filename);
var transformer = csv.transform(function (record, callback) {
  var date = "";
  try {
    date = (new Date(record[4])).toISOString();
  } catch (e) {
    callback(null, null);
    return;
  }

  var object = {
    forum: record[0],
//    category: record[1],
    title: record[2],
    link: record[3],
    creation_date: date,
    content: record[5],
    author: record[6],
//    attachments: record[7],
    votes: record[8]
  };

  callback(null, JSON.stringify(object, null, 2) + ',\n');
}, {parallel: 100});
input.pipe(parser).pipe(transformer).pipe(process.stdout);
