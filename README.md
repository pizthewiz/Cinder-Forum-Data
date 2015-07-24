
# Cinder Forum Data
Explore data extraction from the [Cinder Forum](https://forum.libcinder.org/), with the hope to enable a migration to [Discourse](http://www.discourse.org).

## CSV DUMP
The support staff provided a sample CSV dump, but unfortunately it doesn't seem viable by itself. The forum's message threads cannot be fully reconstructed as it is missing data rows, has incorrect column data and does not have the sufficient columns.

The dump makes the following columns available:
```csv
"Forum Name","Category Name","Topic Title","Permalink","Posted Time","Content","Author","Attachments","Votes"
```

A simple exploration to parse a CSV dump and transform it as JSON is included in the repo as [`tabletop.js`](tabletop.js) and can be executed via:
```sh
$ node tabletop.js --file Forums-SM.csv | less
```

### NOTES
- The `Posted Time` column has the same value for all messages in a topic, the topic creation date not the message
- Messages within a topic are unordered
- Message threading undefined (message in reply to other message)
- The `Permalink` column has the same value for all messages in a topic, links to the topic not the message
- No mapping from topic `Permalink` to numerical topic ID; e.g. [`paleodictyon`](https://forum.libcinder.org/topic/paleodictyon) <-> [`23286000001485179`](https://forum.libcinder.org/#Topic/23286000001485179)
- Messages are missing a title column
- No column for numerical message ID
- Frequently missing message data; e.g. CSV has 13 messages for topic `paleodictyon`, while [the site](https://forum.libcinder.org/topic/paleodictyon) has 14
- The `Votes` column contains only zeros
- Message content is often a full-on HTML blob with inline CSS
- No mapping for username to numerical author ID
- No account info (display name, avatar, email address, credentials), just a username

## WEB SCRAPING
Pulling data from the site directly is obviously brittle, but most of the message data is available, albeit cloaked by the DOM - no missing rows or columns, though fidelity can be an issue.

A simple exploration to scrape a forum thread and transform it to JSON is included in the repo as [`snort.js`](snort.js) and can be executed via:
```sh
$ node snort.js --thread paleodictyon | less
```

### NOTES
- All of the issues above for the CSV dump are addressed by scraping save for the message body being HTML and CSS
- Message post dates are low resolution, the [RSS](https://forum.libcinder.org/feed) has seconds and timezone info
