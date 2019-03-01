'use strict';

class UrlShortener {
  /** Create a URL shortener with SHORTENER_DOMAIN set to domain. */
  constructor(domain) {
    //@TODO:
    this.baseUrl = domain;
    this.collection = new Map();
  }

  /**
   *  The return value for each of the following methods must be
   *  an object.  If an error occurs, then the returned object must
   *  have an 'error' property which itself must be an object having
   *  at least the following 2 properties:
   *
   *   'code':   A short string which specifies the class of error
   *             which occurred.
   *   'message':A detailed string describing the error in as much
   *             detail as possible.  The message must be prefixed with
   *             the 'code', a colon followed by a single space.
   *
   *  The specifications for the methods below specify the 'code'; the
   *  'message' can be any suitable description of the error.  The
   *  intent is that the 'code' property is suitable for use by
   *  machines while the 'message' property is suitable for use by
   *  humans.
   *
   *  Despite the presence of a `remove()` method, an association
   *  should never actually be removed, merely deactivated so that
   *  it is not returned by the `query()` method until it is
   *  added again using the `add()` method.
   */

  /** The argument longUrl must be a legal url.  It is ok if it has
   *  been previously added or removed.  It's domain cannot be the
   *  domain of this url-shortener.
   *
   *  If there are no errors, then return an object having a 'value'
   *  property which contains the short url corresponding to longUrl.
   *  If longUrl was previously added, then the short url *must* be
   *  the same as the previously returned value.  If long url is
   *  currently removed, then it's previous association is made
   *  available to subsequent uses of the query() method.
   *
   *  Errors corresponding to the following 'code's should be detected:
   *
   *   'URL_SYNTAX': longUrl syntax is incorrect (it does not contain
   *                 a :// substring, its domain is empty.
   *
   *   'DOMAIN':     shortUrl domain is equal to SHORTENER_DOMAIN.
   */
  add(longUrl) {
    const urlSyntaxError = this._urlSyntaxError(longUrl);
    if (urlSyntaxError) {
      return urlSyntaxError;
    }
    //check origin
    if (this._isSameOrigin(longUrl)) {
      return {
        error: {
          code: 'DOMAIN',
          message: 'longUrl domain is equal to SHORTENER_DOMAIN',
        },
      };
    }
    //check if exist
    var exists;
    this.collection.forEach((element, key) => {
      if (element.longUrl === longUrl.toLowerCase()) {
        this.collection.set(key, { ...element, active: true });
        exists = key;
      }
    });
    const urlParts = longUrl.toLowerCase().split('/');
    if (exists)
      return {
        value: `${urlParts[0]}//${this.baseUrl}/${exists}`,
      };
    const hash = this._generateHash();
    this.collection.set(hash, {
      longUrl: longUrl.toLowerCase(),
      count: 0,
      active: true,
    });
    return { value: `${urlParts[0]}//${this.baseUrl}/${hash}` };
  }

  /** The argument shortUrl must be a shortened URL previously
   *  returned by the add() method which has not subsequently been
   *  removed by the remove() method.
   *
   *  If there are no errors, then return an object having a 'value'
   *  property which contains the long url corresponding to shortUrl.
   *
   *  Errors corresponding to the following 'code's should be
   *  detected:
   *
   *   'URL_SYNTAX': shortUrl syntax is incorrect (it does not contain
   *                 a :// substring or the domain is empty.
   *
   *   'DOMAIN':     shortUrl domain is not equal to SHORTENER_DOMAIN.
   *
   *   'NOT_FOUND':  shortUrl is not currently registered for this
   *                 service.
   */
  query(shortUrl) {
    const urlSyntaxError = this._urlSyntaxError(shortUrl);
    if (urlSyntaxError) {
      return urlSyntaxError;
    }
    if (!this._isSameOrigin(shortUrl)) {
      return {
        error: {
          code: 'DOMAIN',
          message: 'shortUrl domain is not equal to SHORTENER_DOMAIN',
        },
      };
    }
    const uniqueHash = shortUrl.split('/')[3];
    const exist = this.collection.get(uniqueHash);
    if (exist && exist.longUrl && exist.active) {
      this.collection.set(uniqueHash, {
        ...exist,
        count: exist.count + 1,
      });
      return { value: exist.longUrl };
    }
    return {
      error: {
        code: 'NOT_FOUND',
        message: `NOT_FOUND: ${shortUrl} not found`,
      },
    };
  }

  /** The argument url must be one of a previously added (longUrl,
   *  shortUrl) pair.  It may be the case that url is currently
   *  removed.
   *
   *  If there are no errors, then return an object having a 'value'
   *  property which contains a count of the total number of times
   *  shortUrl was successfully looked up using query().  Note that
   *  the count should be returned even if url is currently removed.
   *
   *  Errors corresponding to the following 'code's should be detected:
   *
   *   'URL_SYNTAX': url syntax is incorrect (it does not contain
   *                 a :// substring, or the domain is empty).
   *
   *   'NOT_FOUND':  url was never registered for this service.
   */
  count(url) {
    const urlSyntaxError = this._urlSyntaxError(url);
    if (urlSyntaxError) {
      return urlSyntaxError;
    }
    if (this._isSameOrigin(url)) {
      const uniqueHash = url.split('/')[3];
      if (this.collection.has(uniqueHash)) {
        const data = this.collection.get(uniqueHash);
        return { value: data.count };
      }
    }
    var exist;
    this.collection.forEach(element => {
      if (element.longUrl === url.toLowerCase()) {
        exist = element.count;
      }
    });
    if (exist >= 0) return { value: exist };
    return this._notFound();
  }

  /** The argument url must be one of a previously added (longUrl,
   *  shortUrl) pair.  It is not an error if the url has already
   *  been removed.
   *
   *  If there are no errors, then return an empty object and make the
   *  association between (longUrl, shortUrl) unavailable to
   *  future uses of the query() method.
   *
   *  Errors corresponding to the following 'code's should be detected:
   *
   *   'URL_SYNTAX':  url syntax is incorrect (it does not contain
   *                  a :// substring, or the domain is empty).
   *
   *   'NOT_FOUND':  url was never registered for this service.
   */
  remove(url) {
    //@TODO:
    const urlSyntaxError = this._urlSyntaxError(url);
    if (urlSyntaxError) {
      return urlSyntaxError;
    }
    if (this._isSameOrigin(url)) {
      const uniqueHash = url.split('/')[3];
      if (this.collection.has(uniqueHash)) {
        const data = this.collection.get(uniqueHash);
        this.collection.set(uniqueHash, { ...data, active: false });
        return {};
      }
    }
    var exist;
    this.collection.forEach((element, key) => {
      if (element.longUrl === url.toLowerCase()) {
        this.collection.set(key, { ...element, active: false });
        exist = true;
      }
    });
    if (exist) return {};
    return this._notFound();
  }

  //@TODO add auxiliary methods here; prefix their names with _, to
  //indicate "private".
  _generateHash() {
    return Math.random()
      .toString(36)
      .slice(5, 12);
  }

  _urlSyntaxError(url) {
    const urlParts = url.split('/');
    if (
      !(
        url.toLowerCase().startsWith('http://') ||
        url.toLowerCase().startsWith('https://')
      ) ||
      !urlParts[2].length ||
      !urlParts[2].includes('.')
    ) {
      return {
        error: {
          code: 'URL_SYNTAX',
          message: `URL_SYNTAX: bad url ${url}`,
        },
      };
    }
    return false;
  }

  _notFound() {
    return {
      error: {
        code: 'NOT_FOUND',
        message: 'url was never registered for this service',
      },
    };
  }

  _isSameOrigin(url) {
    const urlParts = url.toLowerCase().split('/');
    if (urlParts[2] === this.baseUrl) return true;
    return false;
  }
}

//UrlShortener class as only export
module.exports = UrlShortener;

//@TODO Add auxiliary functions here which do not need access to a
//UrlShortener instance; they may be called from methods without
//needing to be prefixed with `this`.
