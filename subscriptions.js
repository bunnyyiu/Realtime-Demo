'use strict';

var redis = require('redis'),
    settings = require('./settings'),
    helpers = require('./helpers'),
    app = settings.app,
    subscriptionPattern = 'channel:*',
    io = require('socket.io').listen(app);

// We use Redis's pattern subscribe command to listen for signals
// notifying us of new updates.

var redisClient = redis.createClient(settings.REDIS_PORT, settings.REDIS_HOST);

var pubSubClient = redis.createClient(settings.REDIS_PORT, settings.REDIS_HOST);
pubSubClient.psubscribe(subscriptionPattern);

pubSubClient.on('pmessage', function (pattern, channel, message) {
  helpers.debug('Handling pmessage: ' + message);

  /* Every time we receive a message, we check to see if it matches
     the subscription pattern. If it does, then go ahead and parse it. */

  if (pattern === subscriptionPattern) {
    var data;
    var channelName;
    try {
      data = JSON.parse(message).data;

      // Channel name is really just a 'humanized' version of a slug
      // san-francisco turns into san francisco. Nothing fancy, just
      // works.
      channelName = channel.split(':')[1].replace(/-/g, ' ');
    } catch (e) {
      return;
    }

    // Store individual media JSON for retrieval by homepage later
    for (var index in data) {
      var media = data[index];
      media.meta = {};
      media.meta.location = channelName;
      redisClient.lpush('media:objects', JSON.stringify(media));
    }

    // Send out whole update to the listeners
    var update = {
      'type': 'newMedia',
      'media': data,
      'channelName': channelName
    };

    io.sockets.send(encodeURIComponent(JSON.stringify(update)));
  }
});
