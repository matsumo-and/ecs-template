const cdkStackTerminationProtection = require('./cdk-stack-termination-protection');

module.exports = {
  rules: {
    'cdk-stack-termination-protection': cdkStackTerminationProtection,
  },
};
