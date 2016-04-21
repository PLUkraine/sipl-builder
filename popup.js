



// to represent '<' or '>' in HTML we need to use "&lt;" or "&gt;"
function changeAngleBrackets(str) {
    var newStr = "";
    for (var i = 0; i < str.length; ++i) {
        if (str[i] == "<") newStr += "&lt;"; else
        if (str[i] == ">") newStr += "&gt;"; else
            newStr += str[i];
    }
    return newStr;
}

// generate string that represent derivation
function derivationToPopUpFormat(der) {
    var str = "";
    for (var i = 0; i < der.length; ++i)
        str += " " + nodeToPopUpFormat(der[i]);
    return str; 
}
function nodeToPopUpFormat(der) {
    var result = "";
    if (der.type == NodeTypes.Number || der.type == NodeTypes.Variable) {
        result += '<input type = "text" name = "text" id="' +der.type+ '"  placeholder="' + der.value() + '">';
    }
    else
        result += changeAngleBrackets(der.value());
    return result;
}
//generate HTML which show list of all possible derivations for choosen node
function popUpDerivations(_node) {
    var derivations = getDerivations(_node.type);
    var text = '<form id="chooseDerivation" class="radio">';
    for (var i = 0; i < derivations.length; ++i) {
        var id = i.toString();
        text += '<label for="radio'+id+'"">';
        text += '<input type="radio" id="radio' + (i).toString() + '" name="derivation" value="'+(i).toString()+'" class="radio">';
        text += '<span>';
        text +=  derivationToPopUpFormat(derivations[i]);
        text += '</span>';
        text += "</label>";
    }
    text += '<button type="button" class="btn btn-primary" onclick="submitInput()">Expand</button>';

    //text += '<input type="submit" value="Submit" onclick="submitInput()">';
    text +="</form>";
    return text;
}

// get index checked derivation from list of radio buttons
function submitInput() {    
    // get index of checked redio button
    var index = parseInt(document.querySelector('input[name="derivation"]:checked').value);

    var chosenDerivation = getDerivations(popUpNode.type)[index];
    try {
        if (chosenDerivation[0].type == NodeTypes.Number || chosenDerivation[0].type == NodeTypes.Variable) {
            var value = document.getElementById(chosenDerivation[0].type).value;
            chosenDerivation[0].setValue(value);
        }
    }
    catch(error) {
        alert(error);
        return;
    }
    if (popUpNode.canExpand(index)) {
        popUpNode.children = chosenDerivation;
    }

    tree.update(popUpNode);
    closeMenu();
}

// private variable
var popUpNode;

// initialize popUpNode and invoke popup showing method
function runPopup(node) {
    popUpNode = node;
    showMenu();

}

function showPopUpMenu() {
    document.getElementById("overlay").style.display = "block";
    document.getElementById("menu").style.display = "block";
    $("#menu").empty();
}

function showMenu() {
    showPopUpMenu();
    document.getElementById("menu").innerHTML = popUpDerivations(popUpNode);
}


function closeMenu() {
    document.getElementById("overlay").style.display = "none";
    document.getElementById("menu").style.display = "none";
    $("#menu").empty();
}


$(document).ready(function(){
    $("#impBtn").click(impJson);
});

$(document).ready(function(){
    $("#expBtn").click(expJson);
});



function impJson() {

    showPopUpMenu();

    var frm = $("<form/>")
        .attr("role", "form");
    
    var dv = $("<div/>")
        .attr("class", "form-group");

    var btn = $('<button/>',
        {
            text: 'Import',
            click: receiveJson,
            class: "btn btn-primary"
        });

    var cansleBtn = $('<button/>',
        {
            text: "Cancel",
            click: closeMenu,
            class: "btn btn-primary"
        });

    var textArea = $("<textarea/>")
        .attr("class", "form-control")
        .attr("id", "txtArea")
        .attr("rows", "10")
        .attr("cols", "40");

    dv.append(textArea);
    dv.append(btn);
    dv.append(cansleBtn);
    frm.append(dv);
    $("#menu").append(dv);
}

function receiveJson() {
    var jsonText = $("#txtArea").val();
    try {
        tree.importTreeFromJSON(jsonText);
    }
    catch(err) {
        alert("Import is not valid");
    }
    closeMenu();
}



function expJson() {

    showPopUpMenu();

    var jsonText = tree.exportTreeToJSON();
    var frm = $("<form/>").attr("role", "form");
    var dv = $("<div/>").attr("class", "form-group");
    var textArea = $("<textarea/>")
        .attr("class", "form-control")
        .attr("id", "txtArea")
        .attr("rows", "10")
        .attr("cols", "40");
    var closeBtn = $('<button/>',
        {
            text: "Close",
            click: closeMenu,
            class: "btn btn-primary"
        });
    textArea.text(jsonText);
    dv.append(textArea);
    dv.append(closeBtn);
    frm.append(dv);
    $("#menu").append(dv);
}