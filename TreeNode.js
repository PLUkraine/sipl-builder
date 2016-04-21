// NodeType says how node behaves. There are terminals like Number, Variable, Terminal 
// and non-terminals like Program, Operator, Condition and Expression
var NodeTypes = {
	Program : 	"<Program>",
	Operator : 	"<Operator>",
	Terminal : 	"<Terminal>", // reserved terminals only!
	Variable: 	"<Variable>",
	Condition: 	"<Condition>",
	Number: 	"<Number>",
	Expression:	"<Expression>"
};

// Reserved keywords and symbols 
var ReservedTerminals = {
	Assignment: 	":=",
	Begin: 			"begin",
	End: 			"end",
	If: 			"if",
	Then: 			"then",
	Skip: 			"skip",
	Do: 			"do",
	Else: 			"else",
	Semicolon: 		";",
	Plus: 			"+",
	Minus: 			"-",
	Asterisc: 		"*",
	More: 			">",
	Negation: 		"!",
	Disjunction: 	"or",
	Equals: 		"=",
	While: 			"while",
	Lpar: 			"(",
	Rpar: 			")"
};

// NodeType -> [[Node]]
// Returns all possible derivations for given node
var getDerivations = function(nodetype) {
	var result = [];
	switch (nodetype) {
	case NodeTypes.Program:
		result =
		[
			[
				Node(NodeTypes.Terminal, ReservedTerminals.Begin), 
				Node(NodeTypes.Operator),
				Node(NodeTypes.Terminal, ReservedTerminals.End)
			]
		];
		break;
	case NodeTypes.Operator:
		result =
		[
			[
				Node(NodeTypes.Variable),
				Node(NodeTypes.Terminal, ReservedTerminals.Assignment),
				Node(NodeTypes.Expression)
			],
			[
				Node(NodeTypes.Operator),
				Node(NodeTypes.Terminal, ReservedTerminals.Semicolon),
				Node(NodeTypes.Operator)
			],
			[
				Node(NodeTypes.Terminal, ReservedTerminals.If),
				Node(NodeTypes.Condition),
				Node(NodeTypes.Terminal, ReservedTerminals.Then),
				Node(NodeTypes.Operator),
				Node(NodeTypes.Terminal, ReservedTerminals.Else), 
				Node(NodeTypes.Operator),
			],
			[
				Node(NodeTypes.Terminal, ReservedTerminals.While),
				Node(NodeTypes.Condition),
				Node(NodeTypes.Terminal, ReservedTerminals.Do),
				Node(NodeTypes.Operator),
			],
			[
				Node(NodeTypes.Terminal, ReservedTerminals.Begin), 
				Node(NodeTypes.Operator),
				Node(NodeTypes.Terminal, ReservedTerminals.End)
			],
			[
				Node(NodeTypes.Terminal, ReservedTerminals.Skip)
			]
		];
		break;
	case NodeTypes.Expression:
		result =
		[
			[
				Node(NodeTypes.Number)
			],
			[
				Node(NodeTypes.Variable)
			],
			[
				Node(NodeTypes.Expression),
				Node(NodeTypes.Terminal, ReservedTerminals.Plus),
				Node(NodeTypes.Expression)
			],
			[
				Node(NodeTypes.Expression),
				Node(NodeTypes.Terminal, ReservedTerminals.Minus),
				Node(NodeTypes.Expression)
			],
			[
				Node(NodeTypes.Expression),
				Node(NodeTypes.Terminal, ReservedTerminals.Asterisc),
				Node(NodeTypes.Expression)
			],
			[
				Node(NodeTypes.Terminal, ReservedTerminals.Lpar),
				Node(NodeTypes.Expression),
				Node(NodeTypes.Terminal, ReservedTerminals.Rpar)
			]
		];
		break;
	case NodeTypes.Condition:
		result = 
		[
			[
				Node(NodeTypes.Expression),
				Node(NodeTypes.Terminal, ReservedTerminals.Equals),
				Node(NodeTypes.Expression)
			],
			[
				Node(NodeTypes.Expression),
				Node(NodeTypes.Terminal, ReservedTerminals.More),
				Node(NodeTypes.Expression)
			],
			[
				Node(NodeTypes.Terminal, ReservedTerminals.Negation),
				Node(NodeTypes.Condition)
			],
			[
				Node(NodeTypes.Condition),
				Node(NodeTypes.Terminal, ReservedTerminals.Disjunction),
				Node(NodeTypes.Condition)
			],
			[
				Node(NodeTypes.Terminal, ReservedTerminals.Lpar),
				Node(NodeTypes.Condition),
				Node(NodeTypes.Terminal, ReservedTerminals.Rpar)
			]
		];
		break;
	default:
		break;
	}
	return result;
}

// Node -> String
// Get formatted SIPL program from given parse tree
// It puts newlines and tabs where necessary
function getCode(node) {

	var text = "";
	var needEnterAfter = ["begin", "end", "do", "then", ";", "else"];
	var needEnterBefor = ["begin", "end", "while", "if", "else"];
	var incTabs = ["begin", "then", "do", "else"];


	dfs(node, 0);
	function ifReallyNeedEnter() {
		if (text.length == 0) return false;
		if (text.slice(-1) == '\n') return false;
		return true;
	}

	function dfs(node, tabs) {
		var additionTab = 0;

		if (needEnterBefor.indexOf(node.value()) != -1) {
			if (ifReallyNeedEnter()) {
				text += '\n';
			}
		}

		if (node.type == NodeTypes.Terminal 
		 || node.children === undefined
		 || node.children.length == 0) 
		{
			if (!ifReallyNeedEnter())
				for (var i = 0; i < tabs; i++) 
					text += "\t";
			text += node.value() + " ";	
		}

		if (needEnterAfter.indexOf(node.value()) != -1) {
			text += '\n';
		}


		if (node.children !== undefined && node.children.length == 1)
		{
			additionTab = dfs(node.children[0], tabs);
			return 0;
		}

		if (node.children !== undefined && node.children.length > 0)
		{
			for (var i = 0; i < node.children.length; i++) {
				var to = node.children[i];
				if (to.value() == "end" || to.value() == "else") {
					additionTab |= dfs(to, tabs);
				}
				else
					additionTab |= dfs(to, tabs + additionTab);
			}
		}

		if (incTabs.indexOf(node.value()) != -1) return 1;
	}
	return text;

}


// Node -> String
// Traverse parse tree and return resulting program
// Resulting program isn't formatted in any way
function getSiplProgram(node) {
	var program = "";
	
	function dfs(node) {
		if (node.children !== undefined && node.children.length > 0) {
			node.children.forEach(function(v) {
				dfs(v);
			});	
		} else {
			program += node.value() + " ";
		}
	}
	return v.text;
}

// NodeTypes -> bool
// Check if given node type supports value change 
 function isNodeValueChangeable(nodetype) {
	return nodetype === undefined
		|| nodetype == NodeTypes.Variable
		|| nodetype == NodeTypes.Number;
};
	 
// NodeTypes, String -> Node
// Create node with given type. Value is an optional parameter
function Node(type, value) {
	// Void -> Bool
	// check if node can have children i.e. expand
	var _canExpand = function() {
		return _node.type == NodeTypes.Program
			|| _node.type == NodeTypes.Operator
			|| _node.type == NodeTypes.Expression
			|| _node.type == NodeTypes.Condition;
	};
	// Void -> Bool
	// check if node's value can change i.e.
	var _isValueChangeable = function() {
		return isNodeValueChangeable(_node.type);
		// return _node === undefined
		// 	|| _node.type == NodeTypes.Variable
		// 	|| _node.type == NodeTypes.Number;
	};

	// Int -> Void
	// Expand node using given rule
	var _expand = function(ruleIndex) {
		if (_canExpand()) {
			_node.children = 
				getDerivations(_node.type)[ruleIndex];
			// for chaining, may be removed if unnecessary
			return _node;
		} else {
			throw("Node isn't expandable");
		}
	};

	// String -> Void
	// Check if node's value corresponds to node's type
	// throws exception otherwise
	var _valueValid = function(value) {
		var maxLength = 10;

		if (value.length > maxLength) {
			throw ("Value is too long");
		}

		// valid number
		if (_node.type == NodeTypes.Number){
			if (!value.match("^-?[0-9]+$")) 
				throw ("Incorrect value for Number type");
			else
				value = String(Number(value)); // erase leading zeros
		}
		// valid variable
		if (_node.type == NodeTypes.Variable) {
			if (value.match("^[_a-zA-Z][_a-zA-Z0-9]*$")) {
				var reservedWords =  ["begin", "end", "if", "then", "skip", "do", "else", "or", "while"];
				if (reservedWords.indexOf(value) > -1) {
					throw ("Name of varriable can't match reserved word");
				}	
			}
			else
				throw("Name of variable is incorrect");
		} 


	}

	// String -> Void
	// Set node's value. Throws exception if value is invalid
	var _setValue = function(newval) {
		if (!_isValueChangeable()) {
			throw("Value can't change for this node");
		}

		_valueValid(newval);
		_value = newval;
	}
	// Void -> String
	// Get current value
	var _getValue = function() {
		return _value;
	}
	
	var _node = {
		expand : _expand,
		canExpand : _canExpand,
		isValueChangeable : _isValueChangeable,
		setValue: _setValue,
		value: _getValue,
		type: type,
		children: []
	}


	// private variables
	var _value;
	if(value === undefined) 
		_value = type;
	else 
	if(type == NodeTypes.Terminal)
		_value = value;
	else
		_setValue(value);
		

	return _node;
}