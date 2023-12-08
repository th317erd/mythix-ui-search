import {
  MythixUIComponent,
  Utils,
  Components,
} from 'mythix-ui-core';

const IS_ACTION_URL = /^([\w-]+:\/\/|\.+\/|\/)/;
const IS_JSON       = /^application\/json/i;

export default class MythixUISearch extends MythixUIComponent {
  static tagName = 'mythix-search';

  constructor() {
    super();

    this.dynamicProp('value', '', (newValue) => {
      // setter

      this.currentValue = newValue;

      let searchField = this.$searchField;
      if (searchField && searchField.value !== newValue)
        searchField.value = newValue;

      return newValue;
    });

    this.dynamicProp('items', [], (newValue) => {
      // setter
      return newValue;
    });

    this.currentValue = '';
  }

  mounted() {
    this.currentValue = (this.$searchField && this.$searchField.value) || this.getAttribute('value');
  }

  setFormAttribute(name, value) {
    let form = this.$form;
    if (!form)
      return;

    if (!value)
      form.removeAttribute(name);
    else
      form.setAttribute(name, value);
  }

  get $submitButton() {
    return this.$({ slotted: true }, 'button').slot('footer')[0];
  }

  get $searchField() {
    return this.$('input[name="value"]')[0];
  }

  get $form() {
    return this.$('form')[0];
  }

  set attr$acceptCharset(value) {
    this.setFormAttribute('accept-charset', value);
  }

  set attr$autocapitalize(value) {
    this.setFormAttribute('autocapitalize', value);
  }

  set attr$autocomplete(value) {
    this.setFormAttribute('autocomplete', value);
  }

  set attr$rel(value) {
    this.setFormAttribute('rel', value);
  }

  set attr$action(value) {
    this.setFormAttribute('action', value);
  }

  set attr$disabled(value) {
    this.setFormAttribute('disabled', value);
  }

  set attr$enctype(value) {
    this.setFormAttribute('enctype', value);
  }

  set attr$method(value) {
    this.setFormAttribute('method', value);
  }

  set attr$novalidate(value) {
    this.setFormAttribute('novalidate', value);
  }

  reportValidity(...args) {
    return this.$form.reportValidity(...args);
  }

  requestSubmit(...args) {
    return this.$form.requestSubmit(...args);
  }

  reset(...args) {
    return this.$form.reset(...args);
  }

  submit(...args) {
    return this.$form.submit(...args);
  }

  isActionUrl(_actionValue) {
    let actionValue = (arguments.length === 0) ? this.getAttribute('action') : _actionValue;
    return IS_ACTION_URL.test(actionValue);
  }

  getFormData(submitter) {
    let inputs = this.$('input,object,select,textarea');
    return inputs.reduce((data, input) => {
      let name = input.getAttribute('name');
      if (!name)
        return data;

      let value = input.value;
      if (value instanceof File)
        data.set(name, value, value.name);
      else
        data.set(name, value);

      return data;
    }, new FormData(this.$form, submitter));
  }

  onFormData(event) {
    this.dispatchEvent(new FormDataEvent('formdata', event));
  }

  onReset(event) {
    this.dispatchEvent(new Event('reset', event));
  }

  onSubmit(_event) {
    let event = _event || {};

    const getAttr = (name) => {
      let s = event.submitter;
      return (s && s.getAttribute(`form${name}`)) || this.getAttribute(name);
    };

    const getFetchOptions = () => {
      const getOption = (name, isBoolean) => {
        let value = this.getAttribute(`data-fetch-${name}`);
        if (isBoolean && value != null)
          options[name] = true;
        else if (Utils.notNOE(value))
          options[name] = value;
      };

      let options = {};

      getOption('mode');
      getOption('credentials');
      getOption('cache');
      getOption('redirect');
      getOption('referrer');
      getOption('referrerPolicy');
      getOption('integrity');
      getOption('keepalive');
      getOption('priority');

      return options;
    };

    event.preventDefault();

    let action      = getAttr('action');
    let enctype     = getAttr('enctype');
    let method      = getAttr('method');
    let noValidate  = getAttr('novalidate');
    let target      = getAttr('target'); // NOT native form attribute!!! (this is specialized)

    if (!action)
      action = 'globalStoreDynamic';

    if (method)
      method = method.toLowerCase();

    if (!target)
      target = 'globalStoreDynamic';

    if (noValidate != null && !this.reportValidity())
      return false;

    let formData    = this.getFormData(event.submitter);
    let submitEvent = new SubmitEvent('submit', event);

    submitEvent.formData = formData;
    submitEvent.valid = true;

    this.dispatchEvent(submitEvent);
    if (submitEvent.defaultPrevented)
      return false;

    (async () => {
      let value   = formData.get('value');
      let context = {
        ...getFetchOptions(),
        previousValue:  this.value.valueOf() || '',
        value:          value,
        valid:          true,
        target:         this,
        formData,
        action,
        enctype,
        method,
        noValidate,
      };

      let items;

      if (this.isActionUrl(action)) {
        let fetchOptions = {
          ...getFetchOptions(),
          method,
        };

        if (method !== 'get' && method !== 'head') {
          fetchOptions.headers = {
            'Content-Type': enctype || 'application/x-www-form-urlencoded',
          };

          fetchOptions.body = formData;
        }

        let { response }  = await Components.require(this.ownerDocument || document, action, { fetchOptions });
        let forcedType    = this.getAttribute('data-content-type');

        if (response.ok) {
          let contentType = forcedType || response.headers.get('content-type');
          if (IS_JSON.test(contentType))
            items = await response.json();
        }

        this.value = items;
      } else {
        let callback = Utils.createEventCallback.call(this, action);
        items = await callback(Utils.globalStoreNameValuePairHelper(
          context,
          Components.getIdentifier(this),
          value,
        ));
      }

      items = (!items) ? [] : items;

      if (Utils.notNOE(target)) {
        let targetCallback = Utils.createEventCallback.call(this, target);

        let targetContext = {
          ...context,
          items,
        };

        items = await targetCallback(Utils.globalStoreNameValuePairHelper(
          targetContext,
          `${Components.getIdentifier(this)}Items`,
          items,
        ));

        items = (!items) ? [] : items;
      }

      this.value = value;
      this.items = value;
    })();
  }

  getDebounceTime() {
    let autoSubmitTime = this.getAttribute('autosubmit');
    if (autoSubmitTime == null)
      return -1;

    autoSubmitTime = parseInt(autoSubmitTime.replace(/\D/g, ''), 10);
    if (!isFinite(autoSubmitTime))
      return -1;

    return autoSubmitTime;
  }

  onSearchKeyUp(event) {
    let newValue = event.target.value;
    if (newValue === this.currentValue)
      return;

    this.currentValue = newValue;

    let debounceTime = this.getDebounceTime();
    if (debounceTime < 0)
      return;

    this.debounce(() => {
      let submitButton = this.$submitButton;
      if (submitButton)
        this.$form.requestSubmit(submitButton);
      else
        this.$form.requestSubmit();
    }, debounceTime);
  }
}

MythixUISearch.register();
