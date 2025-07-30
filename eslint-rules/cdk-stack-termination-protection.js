module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ensure CDK Stack classes have termination protection enabled',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      missingTerminationProtection:
        'CDK Stack "{{className}}" should have termination protection enabled. Add "terminationProtection: true" to the stack props or set "this.terminationProtection = true" in the constructor.',
    },
    schema: [],
  },

  create(context) {
    return {
      ClassDeclaration(node) {
        // Check if this class extends Stack
        if (!isStackClass(node)) {
          return;
        }

        const className = node.id ? node.id.name : 'Unknown';

        // Find the constructor
        const constructor = node.body.body.find(
          (member) => member.type === 'MethodDefinition' && member.kind === 'constructor',
        );

        if (!constructor) {
          return;
        }

        // Check if termination protection is set
        const hasTerminationProtection = checkTerminationProtection(constructor);

        if (!hasTerminationProtection) {
          context.report({
            node: node,
            messageId: 'missingTerminationProtection',
            data: {
              className,
            },
          });
        }
      },
    };
  },
};

/**
 * Check if a class extends cdk.Stack or Stack
 */
function isStackClass(node) {
  if (!node.superClass) {
    return false;
  }

  // Check for direct Stack inheritance
  if (node.superClass.type === 'Identifier' && node.superClass.name === 'Stack') {
    return true;
  }

  // Check for cdk.Stack inheritance
  if (
    node.superClass.type === 'MemberExpression' &&
    node.superClass.object.name === 'cdk' &&
    node.superClass.property.name === 'Stack'
  ) {
    return true;
  }

  return false;
}

/**
 * Check if termination protection is enabled in the constructor
 */
function checkTerminationProtection(constructor) {
  const body = constructor.value.body;

  if (!body || !body.body) {
    return false;
  }

  for (const statement of body.body) {
    // Check for this.terminationProtection = true
    if (isTerminationProtectionAssignment(statement)) {
      return true;
    }

    // Check for super() call with terminationProtection in props
    if (isSuperCallWithTerminationProtection(statement)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if statement is this.terminationProtection = true
 */
function isTerminationProtectionAssignment(statement) {
  if (
    statement.type === 'ExpressionStatement' &&
    statement.expression.type === 'AssignmentExpression' &&
    statement.expression.left.type === 'MemberExpression' &&
    statement.expression.left.object.type === 'ThisExpression' &&
    statement.expression.left.property.name === 'terminationProtection' &&
    statement.expression.right.type === 'Literal' &&
    statement.expression.right.value === true
  ) {
    return true;
  }

  return false;
}

/**
 * Check if statement is super() call with terminationProtection: true in props
 */
function isSuperCallWithTerminationProtection(statement) {
  if (
    statement.type === 'ExpressionStatement' &&
    statement.expression.type === 'CallExpression' &&
    statement.expression.callee.type === 'Super'
  ) {
    // Check if the third argument (props) contains terminationProtection: true
    const propsArg = statement.expression.arguments[2];

    if (!propsArg) {
      return false;
    }

    // Handle object expression directly passed
    if (propsArg.type === 'ObjectExpression') {
      return hasTerminationProtectionProperty(propsArg);
    }

    // Handle spread operator with terminationProtection
    if (propsArg.type === 'ObjectExpression') {
      for (const property of propsArg.properties) {
        if (
          property.type === 'Property' &&
          property.key.name === 'terminationProtection' &&
          property.value.type === 'Literal' &&
          property.value.value === true
        ) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Check if an object expression has terminationProtection: true
 */
function hasTerminationProtectionProperty(objectExpression) {
  for (const property of objectExpression.properties) {
    if (
      property.type === 'Property' &&
      property.key.name === 'terminationProtection' &&
      property.value.type === 'Literal' &&
      property.value.value === true
    ) {
      return true;
    }
  }
  return false;
}
