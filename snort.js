#!/usr/bin/env node
/*jshint node:true, strict:true */
'use strict';

var util = require('util');
var request = require('request');
var cheerio = require('cheerio');

// NB: numerical topic ID loads content via XHR, slug topic is self-contained
//  https://forum.libcinder.org/#Topic/23286000001485179
//    xhr: https://forum.libcinder.org/getSinglePost.do?forumTopicId=23286000001485179&forumGroupId=23286000000003001&portalzaid=-1&supportPortal=&portalzaaid=-1
//  https://forum.libcinder.org/topic/paleodictyon
function parseThread(topicSlug, callback) {
  var url = util.format('https://forum.libcinder.org/topic/%s', topicSlug);
  request.get(url, {}, function (err, res, body) {
    if (err) {
      console.error('ERROR - failed to GET: ', err);
      callback(err);
      return;
    }

    if (res.statusCode < 200 || res.statusCode > 299) {
      console.error('ERROR - bad status code: ', res.statusCode);
      callback('bad status code');
      return;
    }

    var $ = cheerio.load(body);

    var thread = {
      id: $('#SinglePostContainer').attr('forumtopicid')
    };

    var message = {
      id: $('.sppostContent').attr('id').replace('fullResponseContainer_', '')
    };
    var profileImageElement = $('.postContainer > .sppostAuthor .normalPhoto > img');
    message.author = {
      id: profileImageElement.attr('authorid'),
      userName: profileImageElement.attr('authorname'),
      displayName: profileImageElement.attr('alt')
    };
    // NB: displayName is a duplicate of userName in this instance
    delete message.author.displayName;

    var titleAnchorElement = $('.sppostContent #DocumentTitle a');
    thread.title = message.title = titleAnchorElement.text();
    thread.url = message.url = titleAnchorElement.attr('href');

    var creationDateString = $('.postContainer .sppostContentWrapper em.ndboldem').attr('title');
    // NB: date seems to be GMT-0400
    message.creationDate = (new Date(creationDateString + ' GMT-0400')).toISOString();

    message.body = '<div>' + $('#responseContentContainer_' + message.id).html() + '</div>';

    if ($('#topicVoteLink').length !== 0) {
      message.voteCount = parseInt($('#topicVoteLink').attr('responsevotecount') || '0', 10);
    }

    thread.message = message;

    // replies
    thread.replies = [];
    $('.spreplyContainer .spsingleReplyContainer').each(function () {
      var message = {
        id: $(this).prev().attr('id')
      };

      var responseID = ($(this).attr('threadresponses') || '').replace('_thread', '');
      if (responseID !== '') {
        message.responseID = responseID;
      }

      var profileImageElement = $(this).find('.sppostAuthor .normalPhoto > img');
      message.author = {
        id: profileImageElement.attr('authorid'),
        userName: profileImageElement.attr('authorname'),
        displayName: profileImageElement.attr('alt')
      };

      var titleAnchorElement = $(this).find('.responseTitleLink');
      message.title = titleAnchorElement.text();
      message.url = titleAnchorElement.attr('href');

      var creationDateString = $(this).find('em.ndboldem').attr('title');
      message.creationDate = (new Date(creationDateString + ' GMT-0400')).toISOString();

      message.body = '<div>' + $('#responseContentContainer_' + message.id).html() + '</div>';

      if ($(this).find('div.bestIcon').length !== 0) {
        message.isBestAnswer = true;
      }
      // NB: votes are only visible when authenticated

      // NB: strangely false positives with $(this).find('span.spam[purpose=inappropriateReason]')
      if ($(this).find('span.spam').attr('purpose') === 'inappropriateReason') {
        message.isPossiblySpam = true;
      }

      thread.replies.push(message);
    });

    callback(null, thread);
  });
}

// NB: XHR shit again
//  https://forum.libcinder.org/#User/pithewiz
//    xhr: https://forum.libcinder.org/getAuthorProfile.do?forumGroupId=23286000000003001&authorName=pithewiz&zdrpn=e19aee61-20e0-4494-a0cb-cfa60dd2dfc3&ch=false&portalzaid=-1&supportPortal=&portalzaaid=-1
//  https://forum.libcinder.org/user/pithewiz
function parseUser(userName, callback) {
  var url = util.format('https://forum.libcinder.org/user/%s', userName);
  request.get(url, {}, function (err, res, body) {
    if (err) {
      console.error('ERROR - failed to GET: ', err);
      callback(err);
      return;
    }

    if (res.statusCode < 200 || res.statusCode > 299) {
      console.error('ERROR - bad status code: ', res.statusCode);
      callback('bad status code');
      return;
    }

    var $ = cheerio.load(body);

    var elem = $('div#userProfileMainContainer');
    var user = {
      id: elem.attr('authorid'),
      userName: userName,
      displayName: elem.attr('authorname')
    };

    callback(null, user);
  });
}

// ----------------------------------------------------------------------------
parseThread('paleodictyon', function (err, thread) {
  console.log(util.inspect(thread, {depth: null}));
});

// parseUser('USERNAME', function (err, user) {
//   console.log(util.inspect(user, {depth: null}));
// });
