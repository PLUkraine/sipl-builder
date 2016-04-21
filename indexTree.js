// This acts like namespace for out tree and utility functions
var tree = new function() {
    // some constants
    var gapBetweenLevels = 140;
    var nodeSize = [110, 30];
    // animation duration
    var duration = 750;
    var textShiftY = -4;
    var nodeTerminalColor = "rgb(112, 220, 14)";
    var nodeNumberColor =  "rgb(255, 90, 64)";//"rgb(255, 187, 62)";//"rgb(25, 176, 62)";//"rgb(255, 90, 64)";//"rgb(255, 104, 194)"
    var nodeVariableColor = "rgb(255, 143, 0)";
    var nodeNormalColor = "rgb(255,255,255)";

    // "rgb(255, 187, 62)"

    // because D3 likes to shuffle data in animation, we use ID to force it do correct 
    // transitions
    var A_GUID = 0;


    // this is our data
    // we start with only Program
    var parseTreeData = Node(NodeTypes.Program);
    // x0 and y0 are needed for smooth animated translation of nodes and edges after update
    parseTreeData.x0 = parseTreeData.y0 = 0;

    // zoom object
    var zm = d3.behavior.zoom().scaleExtent([0.2,3]).on("zoom", redraw);

    // get reference to main container
    var svg = d3.select("svg.tree-container")
        .call(zm)
      .append("g")

    zm.translate([0,0]);

    // create tree layout
    // d3 will compute node's location and edges for us!
    var tree = d3.layout.tree()
        .nodeSize(nodeSize)
        .separation(function (a, b) {
            return a.parent === b.parent ? 1.5 : 3;
        });

    // this creates function for creating curves for edges
    var diagonal = d3.svg.diagonal()
      .projection(function(d) { return [d.x + nodeSize[0]/2,
      									d.y + nodeSize[1]/2]; });

    // update scene using source as enter nodes' birth location
    this.update = function(source) {
        // get nodes and edges
        var nodes = tree.nodes(parseTreeData);
        var links = tree.links(nodes);

        // normalize for fixed-depth
        nodes.forEach(function (d) { return d.y = d.depth * gapBetweenLevels; });

        // update nodes!
        var node = svg.selectAll("g.node")
            .data(nodes, function (d) {
            	return d.id || (d.id = A_GUID++);
            });
        // enter new nodes
        var nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .attr("transform", function(d) { return "translate("+(source.x0+nodeSize[0]/2)+","+(source.y0+nodeSize[1]/2)+")"; })
            .on("click", onNodeClick);   
        nodeEnter.append("rect")
            .attr("width", 1e-6)
            .attr("height", 1e-6)
            .style("fill", function(d) {
                if (d.type == NodeTypes.Number) 
                    return nodeNumberColor;
                else if (d.type == NodeTypes.Variable)
                    return nodeVariableColor;
                else if (d.type == NodeTypes.Terminal)
                    return nodeTerminalColor;
                else
                    return nodeNormalColor;
            });
        nodeEnter.append("text")
        	.attr("x", 0)
            .attr("y",  0 - textShiftY)
            .text(function(d) {return d.value();})
            .attr("text-anchor", "middle")
            .style("fill-opacity", 1e-6);

        // update remaining
        var nodeUpdate = node.transition()
            .duration(duration)
            .attr("transform", function(d) { return "translate("+d.x+","+d.y+")"; });
        nodeUpdate.select("rect")
            .attr("width", nodeSize[0])
            .attr("height", nodeSize[1])
            .style("fill", function(d) {
                if (d.type == NodeTypes.Number) 
                    return nodeNumberColor;
                else if (d.type == NodeTypes.Variable)
                    return nodeVariableColor;
                else if (d.type == NodeTypes.Terminal)
                    return nodeTerminalColor;
                else
                    return nodeNormalColor;
            });
        nodeUpdate.select("text")
        	.attr("x",  nodeSize[0]/2)
            .attr("y",  nodeSize[1]/2 - textShiftY)
            .style("fill-opacity", 1)
            .text(function(d) {return d.value();});
        // delete non-existing nodes
        var nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", function(d) { return "translate("+(source.x+nodeSize[0]/2)+","+(source.y+nodeSize[1]/2)+")"; })
            .remove();
        nodeExit.select("rect")
            .attr("width", 1e-6)
            .attr("height", 1e-6);
        nodeExit.select("text")
            .style("fill-opacity", 1e-6)
            .attr("x", 0)
            .attr("y", 0 - textShiftY)
            .text(function(d) {return d.value();});

        // update links!
        var link = svg.selectAll("path.link")
            .data(links, function (d) {
            	return d.target.id;
            });
        // enter new links
        link.enter().insert("path", "g")
            .attr("class", "link")
            .attr("d", function (d) {
                var o = {x: source.x0, y: source.y0};
                return diagonal({source: o, target: o})
            });
        // update remaining
        link.transition()
            .attr("d", diagonal)
            .duration(duration);
        // delete non-existing links
        link.exit().transition()
            .duration(duration)
            .attr("d", function(d) {
                var o = {x: source.x, y: source.y};
                return diagonal({source: o, target: o});
            })
            .remove();

        // update x0 and y0 to new x and y for future transitions
        nodes.forEach(function(d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });

        // update text of program in document
        d3.select("pre.program")
            .text(getCode(parseTreeData));
    }
    function onNodeClick(d) {
        if (d.canExpand()) {
            // Update occure in popup submitInput() 
            runPopup(d);
        } else if (d.isValueChangeable()) {
            val = prompt("Old: "+d.value());
            d.setValue(val);
            update(d);
        }
    }
    this.update(parseTreeData);

    // callback function for zooming and panning event
    function redraw() {
      	svg.attr("transform",
          	"translate(" + d3.event.translate + ")"
         	+ " scale(" + d3.event.scale + ")");
    }

    // String -> Void
    // Convert string to object and use it as our data
    this.importTreeFromJSON = function(jsonstring) {
        parseTreeData = JSON.parse(jsonstring);
        function convertJSONToNode(root) {
            var newroot = null;
            if (isNodeValueChangeable(root.type) || root.type == NodeTypes.Terminal) {
                newroot = Node(root.type, root.value);
            } else {
                newroot = Node(root.type);
            }

            if (root.children && root.children.length > 0) {
                root.children.forEach(function (child) {
                    newroot.children.push(convertJSONToNode(child));
                });
            }
            return newroot;
        }
        parseTreeData = convertJSONToNode(parseTreeData);
        // for correct animation
        parseTreeData.x0 = parseTreeData.y0 = 0;
        this.update(parseTreeData);
    }

    // Void -> String
    // Form JSON from parseTreeData and return this new object as string
    this.exportTreeToJSON = function() {
        // traverse tree (DFS) and create deep copy of it
        // new object is { value, type, children }
        function buildJSONObject(root) {
            var newroot =  {
                value: root.value(),
                children: [],
                type: root.type
            }

            if (root.children && root.children.length > 0) {
                root.children.forEach(function (child) {
                    newroot.children.push(buildJSONObject(child));
                });
            }
            return newroot;
        }

        return JSON.stringify(buildJSONObject(parseTreeData),  null, '  ');
    }
}
