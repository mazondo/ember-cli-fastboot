/* global FastBoot */
import Ember from "ember";

const { deprecate, computed, get } = Ember;
const { deprecatingAlias, readOnly } = computed;

const RequestObject = Ember.Object.extend({
  init() {
    this._super(...arguments);

    let request = this.request;
    delete this.request;

    this.cookies = request.cookies;
    this.headers = request.headers;
    this.queryParams = request.queryParams;
    this.path = request.path;
    this.protocol = request.protocol;
    this._host = function() {
      return request.host();
    };
  },

  host: computed(function() {
    return this._host();
  })
});

const Shoebox = Ember.Object.extend({
  put(key, value) {
    Ember.assert('shoebox.put is only invoked from the FastBoot rendered application', this.get('fastboot.isFastBoot'));
    Ember.assert('the provided key is a string', typeof key === 'string');

    let fastbootInfo = this.get('fastboot._fastbootInfo');
    if (!fastbootInfo.shoebox) { fastbootInfo.shoebox = {}; }

    fastbootInfo.shoebox[key] = value;
  },

  retrieve(key) {
    if (this.get('fastboot.isFastBoot')) {
      let shoebox = this.get('fastboot._fastbootInfo.shoebox');
      if (!shoebox) { return; }

      return shoebox[key];
    }

    let shoeboxItem = this.get(key);
    if (shoeboxItem) { return shoeboxItem; }

    let $el = Ember.$(`#shoebox-${key}`);
    if (!$el.length) { return; }
    let valueString = $el.text();
    if (!valueString) { return; }

    shoeboxItem = JSON.parse(valueString);
    this.set(key, shoeboxItem);

    return shoeboxItem;
  }
});

export default Ember.Service.extend({
  cookies: deprecatingAlias('request.cookies', { id: 'fastboot.cookies-to-request', until: '0.9.9' }),
  headers: deprecatingAlias('request.headers', { id: 'fastboot.headers-to-request', until: '0.9.9' }),

  init() {
    this._super(...arguments);

    let shoebox = Shoebox.create({ fastboot: this });
    this.set('shoebox', shoebox);
  },

  host: computed(function() {
    deprecate(
      'Usage of fastboot service\'s `host` property is deprecated.  Please use `request.host` instead.',
      false,
      { id: 'fastboot.host-to-request', until: '0.9.9' }
    );

    return this._fastbootInfo.request.host();
  }),

  response: readOnly('_fastbootInfo.response'),

  request: computed(function() {
    if (!get(this, 'isFastBoot')) return null;
    return RequestObject.create({ request: get(this, '_fastbootInfo.request') });
  }),

  isFastBoot: computed(function() {
    return typeof FastBoot !== 'undefined';
  }),

  deferRendering(promise) {
    Ember.assert('deferRendering requires a promise or thennable object', typeof promise.then === 'function');
    this._fastbootInfo.deferRendering(promise);
  }
});
