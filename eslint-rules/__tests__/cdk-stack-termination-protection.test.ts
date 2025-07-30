import { RuleTester } from 'eslint';

// @ts-ignore - JavaScript module
const rule = require('../cdk-stack-termination-protection');

const ruleTester = new RuleTester({
  // @ts-ignore - parser option is valid for RuleTester
  parser: require.resolve('@typescript-eslint/parser'),
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
});

describe('cdk-stack-termination-protection rule', () => {
  ruleTester.run('cdk-stack-termination-protection', rule, {
    valid: [
      // Case 1: terminationProtection: true in super() call
      {
        code: `
          import * as cdk from 'aws-cdk-lib';
          export class MyStack extends cdk.Stack {
            constructor(scope: Construct, id: string, props?: cdk.StackProps) {
              super(scope, id, { ...props, terminationProtection: true });
            }
          }
        `,
      },
      // Case 2: this.terminationProtection = true
      {
        code: `
          import * as cdk from 'aws-cdk-lib';
          export class MyStack extends cdk.Stack {
            constructor(scope: Construct, id: string, props?: cdk.StackProps) {
              super(scope, id, props);
              this.terminationProtection = true;
            }
          }
        `,
      },
      // Case 3: Not a Stack class
      {
        code: `
          export class MyConstruct {
            constructor() {
              // Not a Stack, so no warning
            }
          }
        `,
      },
      // Case 4: No constructor (should not warn)
      {
        code: `
          import * as cdk from 'aws-cdk-lib';
          export class MyStack extends cdk.Stack {
            // No constructor defined
          }
        `,
      },
      // Case 5: Direct Stack inheritance with terminationProtection
      {
        code: `
          import { Stack } from 'aws-cdk-lib';
          export class MyStack extends Stack {
            constructor(scope: Construct, id: string, props?: StackProps) {
              super(scope, id, { terminationProtection: true });
            }
          }
        `,
      },
    ],

    invalid: [
      // Case 1: No termination protection set (default)
      {
        code: `
          import * as cdk from 'aws-cdk-lib';
          export class MyStack extends cdk.Stack {
            constructor(scope: Construct, id: string, props?: cdk.StackProps) {
              super(scope, id, props);
            }
          }
        `,
        errors: [
          {
            messageId: 'missingTerminationProtection',
            data: { className: 'MyStack' },
          },
        ],
      },
      // Case 2: terminationProtection: false
      {
        code: `
          import * as cdk from 'aws-cdk-lib';
          export class MyStack extends cdk.Stack {
            constructor(scope: Construct, id: string, props?: cdk.StackProps) {
              super(scope, id, { ...props, terminationProtection: false });
            }
          }
        `,
        errors: [
          {
            messageId: 'missingTerminationProtection',
            data: { className: 'MyStack' },
          },
        ],
      },
      // Case 3: terminationProtection: null
      {
        code: `
          import * as cdk from 'aws-cdk-lib';
          export class MyStack extends cdk.Stack {
            constructor(scope: Construct, id: string, props?: cdk.StackProps) {
              super(scope, id, { terminationProtection: null });
            }
          }
        `,
        errors: [
          {
            messageId: 'missingTerminationProtection',
            data: { className: 'MyStack' },
          },
        ],
      },
      // Case 4: terminationProtection: undefined
      {
        code: `
          import * as cdk from 'aws-cdk-lib';
          export class MyStack extends cdk.Stack {
            constructor(scope: Construct, id: string, props?: cdk.StackProps) {
              super(scope, id, { terminationProtection: undefined });
            }
          }
        `,
        errors: [
          {
            messageId: 'missingTerminationProtection',
            data: { className: 'MyStack' },
          },
        ],
      },
      // Case 5: this.terminationProtection = false
      {
        code: `
          import * as cdk from 'aws-cdk-lib';
          export class MyStack extends cdk.Stack {
            constructor(scope: Construct, id: string, props?: cdk.StackProps) {
              super(scope, id, props);
              this.terminationProtection = false;
            }
          }
        `,
        errors: [
          {
            messageId: 'missingTerminationProtection',
            data: { className: 'MyStack' },
          },
        ],
      },
      // Case 6: this.terminationProtection = null
      {
        code: `
          import * as cdk from 'aws-cdk-lib';
          export class MyStack extends cdk.Stack {
            constructor(scope: Construct, id: string, props?: cdk.StackProps) {
              super(scope, id, props);
              this.terminationProtection = null;
            }
          }
        `,
        errors: [
          {
            messageId: 'missingTerminationProtection',
            data: { className: 'MyStack' },
          },
        ],
      },
      // Case 7: this.terminationProtection = undefined
      {
        code: `
          import * as cdk from 'aws-cdk-lib';
          export class MyStack extends cdk.Stack {
            constructor(scope: Construct, id: string, props?: cdk.StackProps) {
              super(scope, id, props);
              this.terminationProtection = undefined;
            }
          }
        `,
        errors: [
          {
            messageId: 'missingTerminationProtection',
            data: { className: 'MyStack' },
          },
        ],
      },
      // Case 8: Direct Stack inheritance without protection
      {
        code: `
          import { Stack } from 'aws-cdk-lib';
          export class MyStack extends Stack {
            constructor(scope: Construct, id: string, props?: StackProps) {
              super(scope, id, props);
            }
          }
        `,
        errors: [
          {
            messageId: 'missingTerminationProtection',
            data: { className: 'MyStack' },
          },
        ],
      },
    ],
  });
});
