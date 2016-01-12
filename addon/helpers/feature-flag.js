import Ember from 'ember';
import getOwner from 'ember-getowner-polyfill';

export function featureFlag([featureName]) {
  Ember.assert(`Helper featureFlag('${featureName}') cannot run at runtime and should be removed at compile-time. `, false);
}

export default Ember.Helper.helper(featureFlag);
