import Ember from 'ember';
import ENV from '../config/environment';

export function featureFlag([featureName]) {
  const featureFlagOptions = ENV.featureFlag;
  if (featureFlagOptions && featureFlagOptions.strip) {
    Ember.assert(`Helper featureFlag('${featureName}') cannot run at runtime and should be removed at compile-time. `, false);
  } else if (featureFlagOptions && featureFlagOptions.features) {
    return featureFlagOptions.features[featureName];
  } else {
    Ember.warn(`Unknown feature '${ featureName }' found. Return false by assumption. `);
    return false;
  }
}

export default Ember.Helper.helper(featureFlag);
