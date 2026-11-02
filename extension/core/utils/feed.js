/* global sax */

if (typeof importScripts !== 'undefined') {
  self.importScripts('/core/utils/sax.js');
}

const convert = code => {
  return new Promise((resolve, reject) => {
    let tree;

    class Node {
      constructor(name, attributes) {
        this.name = name;
        this.attributes = attributes;
        this.children = [];
      }
    }

    const parser = sax.parser(false);
    parser.onopentag = function(node) {
      const child = new Node(node.name, node.attributes);

      if (!tree) {
        tree = child;
      }
      else {
        child.parent = tree;
        tree.children.push(child);
        tree = child;
      }
    };

    parser.onclosetag = function(name) {
      if (name === tree.name) {
        if (tree.parent) {
          tree = tree.parent;
        }
      }
    };
    parser.ontext = text => tree.text = text;
    parser.onend = () => {
      resolve(tree);
    };
    parser.onerror = e => reject(e);
    parser.write(code).end();
  });
};

class Feed {
  #timeout;
  #isPrivate;
  constructor(feed, timeout, isPrivate) {
    this.href = feed;
    this.#timeout = timeout;
    this.#isPrivate = isPrivate;
  }
  execute(signal, duplicated = () => false) {
    const isPrivate = this.#isPrivate;

    // Sometimes id is wrong in the feed structure!
    const fixID = link => {
      const id = /u\/\d+/.exec(this.href);
      if (id && id.length) {
        return link.replace(/u\/\d+/, id[0]);
      }
      return link;
    };
    const host = href => {
      try {
        return new URL(href).host;
      }
      catch (e) {
        return '';
      }
    };
    const controller = new AbortController();
    signal.addEventListener('abort', () => controller.abort(signal.reason), {
      signal: controller.signal
    });
    const id = setTimeout(() => controller.abort('TIMEOUT'), this.#timeout);
    const href = this.href + '?rand=' + Math.round(Math.random() * 10000000);
    // the feed's own controller: it carries the check's abort and the timeout both
    return fetch(href, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal
    }).then(async r => {
      // Gmail refuses the account: it needs its password again, or nobody is signed in
      if (r.status === 401) {
        clearTimeout(id);
        return {
          isPrivate,
          network: true,
          notAuthorized: true,
          xml: null,
          newIDs: []
        };
      }
      // any other refusal (an outage, a rate limit) says nothing of the account: the check
      // takes it as a feed that did not answer
      if (!r.ok) {
        clearTimeout(id);
        throw Error('feed -> ' + r.status);
      }
      // a place past the accounts signed in: Gmail sends it to the first account, and the walk
      // of the accounts ends here
      if (r.url.includes('/u/0/') && this.href.includes('/u/0/') === false) {
        clearTimeout(id);
        return {
          isPrivate,
          network: true,
          notAuthorized: true,
          signedOut: true,
          xml: null,
          newIDs: []
        };
      }
      // sent to another site, Google's sign-in page above all: this account is not signed in,
      // the ones after it may be
      if (r.url && host(r.url) !== host(this.href)) {
        clearTimeout(id);
        return {
          isPrivate,
          network: true,
          notAuthorized: true,
          xml: null,
          newIDs: []
        };
      }

      const content = await r.text();
      clearTimeout(id);
      // when it came, for the difference between this computer's clock and Gmail's
      const at = Date.now();
      // a page in place of the feed (an error page of Gmail's) is no answer either
      if (!/<feed[\s>]/.test(content)) {
        throw Error('feed -> not a feed');
      }
      // global id
      const uid = (content.split('<title>')[1] || '').split('</title>')[0];
      if (uid) {
        if (duplicated(uid)) {
          return {
            isPrivate,
            network: r.status !== 0,
            notAuthorized: true,
            xml: null,
            newIDs: []
          };
        }
      }
      //
      const tree = await convert(content);

      const xml = {
        get fullcount() {
          let one = 0;
          for (const node of tree.children) {
            if (node.name === 'FULLCOUNT') {
              one = Number(node.text);
              break;
            }
          }
          const two = tree.children.filter(o => o.name === 'ENTRY').length;

          return Math.max(one, two);
        },
        // snapshot time; the entry level MODIFIED is read one level deeper
        get modified() {
          for (const node of tree.children) {
            if (node.name === 'MODIFIED') {
              return node.text;
            }
          }
          return '';
        },
        get id() {
          return uid;
        },
        get title() {
          let title = '';
          for (const node of tree.children) {
            if (node.name === 'TITLE') {
              title = node.text;
              break;
            }
          }
          try {
            return title.match(/[^ ]+@.+\.[^ ]+/)[0];
          }
          catch (e) {
            return title;
          }
        },
        get label() {
          for (const node of tree.children) {
            if (node.name === 'TAGLINE') {
              const match = node.text.match(/'(.*)' label/);
              if (match && match.length == 2) {
                return match[1];
              }
            }
          }
          return '';
        },
        get link() {
          let temp = this.rootLink;
          const label = this.label;
          if (label) {
            temp += '/?shva=1#label/' + label;
          }
          // account selector uses this url as account identifier
          if (isPrivate) {
            temp += '@private';
          }
          return temp;
        },
        get rootLink() {
          let temp = 'https://mail.google.com/mail/u/0';
          // Inbox href
          for (const node of tree.children) {
            if (node.name === 'LINK') {
              temp = node.attributes?.HREF;
              break;
            }
          }
          temp = temp.replace('http://', 'https://');
          return fixID(temp);
        },
        get authorized() {
          for (const node of tree.children) {
            if (node.name === 'TITLE') {
              return true;
            }
          }
          return false;
        },
        get entries() {
          return tree.children.filter(o => o.name === 'ENTRY').map(node => {
            const o = {};
            for (const c of node.children) {
              if (c.name === 'TITLE') {
                o.title = c.text;
              }
              else if (c.name === 'SUMMARY') {
                o.summary = c.text;
              }
              else if (c.name === 'MODIFIED') {
                o.modified = c.text;
              }
              else if (c.name === 'ISSUED') {
                o.issued = c.text;
              }
              else if (c.name === 'ID') {
                o.id = c.text;
              }
              else if (c.name === 'LINK') {
                o.link = fixID((c.attributes.HREF || '').replace('http://', 'https://'));
              }
              else if (c.name === 'AUTHOR') {
                for (const nn of c.children) {
                  if (nn.name === 'NAME') {
                    o['author_name'] = nn.text;
                  }
                  else if (nn.name === 'EMAIL') {
                    o['author_email'] = nn.text;
                  }
                }
              }
            }
            o['author_email'] = o['author_email'] || '';
            // a sender without a name is told by the address
            o['author_name'] = o['author_name'] || o['author_email'];
            o.title = o.title || '';
            o.summary = o.summary || '';

            return o;
          });
        }
      };
      // The mail already told, one list per feed: the label feeds of one account each list
      // their own mail, and a list shared by them lost what the other feed had told. A Gmail
      // feed's list goes by the account's address and the label, not its place in the browser
      // (/u/<n>), which moves when an account before it signs out. The lists of earlier
      // versions, by the feed's address and by the account, are read until it has its own.
      const box = /\/mail\/u\/\d+\/feed\/atom(.*)$/.exec(this.href);
      const key = box && xml.title ? 'ids.box.' + xml.title + box[1] : 'ids.feed.' + this.href;
      const older = 'ids.feed.' + this.href;
      const legacy = 'ids.account.' + xml.title;
      // A local storage that is full (an own sound takes most of its 10 MB) refuses the list:
      // the session keeps it then, or the same mail would be told at every check.
      const spare = 'ids.spare.' + key;
      return chrome.storage.session.get(spare).catch(() => ({})).then(kept => new Promise(resolve => {
        chrome.storage.local.get({
          [key]: null,
          [older]: null,
          [legacy]: [],
          'threatAsNew': 10 // minutes
        }, prefs => {
          const seen = [...[key, older, legacy].map(k => prefs[k]).find(Array.isArray) || [],
            ...Array.isArray(kept?.[spare]) ? kept[spare] : []];
          const own = Array.isArray(prefs[key]);
          const newIDs = [];
          const oldIDs = [];
          // a mail's age by Gmail's own clock, the feed's time: a computer whose clock runs
          // ahead would find no mail new, one behind would tell old mail again
          const sent = Date.parse(xml.modified);
          const now = Number.isFinite(sent) ? sent : Date.now();
          for (const {id, modified} of xml.entries) {
            const age = (now - (new Date(modified)).getTime());
            if (age > 1000 * 60 * prefs.threatAsNew) {
              oldIDs.push(id);
            }
            else if (seen.includes(id)) {
              oldIDs.push(id);
            }
            else {
              newIDs.push(id);
            }
          }
          resolve({
            isPrivate,
            network: true,
            notAuthorized: xml.authorized === false,
            href: this.href,
            at,
            xml,
            newIDs,
            // we postpone the save of new ids to make sure the request is not being aborted
            commit() {
              // the first commit of a feed writes its own list, so the account's one is read once
              if (newIDs.length || own === false) {
                const list = [...oldIDs, ...newIDs];
                chrome.storage.local.set({
                  [key]: list
                }).then(() => kept?.[spare] && chrome.storage.session.remove(spare),
                  () => chrome.storage.session.set({[spare]: list})).catch(() => {});
                if (own === false && older !== key && Array.isArray(prefs[older])) {
                  chrome.storage.local.remove(older);
                }
              }
            }
          });
        });
      }));
    }).catch(e => {
      clearTimeout(id);
      throw e;
    });
  }
}
