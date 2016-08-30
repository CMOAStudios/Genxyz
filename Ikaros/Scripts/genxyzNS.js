var Genxyz = {};

//just setting the context.
Genxyz.mouseLeft = false;
Genxyz.mouseRight = false;
Genxyz.mouseMiddle = false;
//add some variables for click positons.
Genxyz.mouseX;
Genxyz.mouseY;
Genxyz.lastMouseX;
Genxyz.lastMouseY;
Genxyz.mouseWorld = new THREE.Vector2();
Genxyz.clickX;
Genxyz.clickY;
Genxyz.lastClickX;
Genxyz.lastClickY;
Genxyz.cameraX = 0;
Genxyz.cameraY = 0;
Genxyz.RotateMultiplier = 0.2;

Genxyz.Gfx = {};
Genxyz.Gfx.Update = true;
Genxyz.Gfx.Offset = new THREE.Vector3();
Genxyz.Gfx.Nodes = {};

Genxyz.Gfx.HelperPlane;
Genxyz.Gfx.Offset;

//Some lock functionality.
Genxyz.lockMouseMoveFunction = false;

//Updating functionalities here.
Genxyz.currentTick = 0;
Genxyz.defaultTickTarget = 5;
Genxyz.maxTickTarget = 10;
Genxyz.pendingUpdate = false;

Genxyz.currentTickTarget = Genxyz.defaultTickTarget;

//zoom and such.
Genxyz.nodeSize = 25;
Genxyz.zoom = 100;
Genxyz.fontSize = 14;

//this helps with keycodes and such.
Genxyz.uiFocused = true;
Genxyz.uiFocusedToggled = false;

//Some control and communication values here.
Genxyz.selectedNodes = [];
Genxyz.targetedNode;
Genxyz.hoverNode = -1;
Genxyz.instance;

//Layers
Genxyz.layers = {};

//LayerUI
Genxyz.LayerUI = {};
Genxyz.LayerUI.activeGenLayers = [];
Genxyz.LayerUI.selectedLayers = [];
Genxyz.LayerUI.activeLayer = null;

//Interface stuff
Genxyz.UI = {};
Genxyz.UI.CreateOnClick;
Genxyz.UI.Creating;
Genxyz.UI.Errors = new Array();
Genxyz.UI.ShowGrid = false;
Genxyz.UI.Snap = false;
Genxyz.UI.Debug = false;
Genxyz.UI.Help = false;

Genxyz.UI.minX = 0;
Genxyz.UI.minY = 0;

//grid things.
Genxyz.UI.Grid = {};

Genxyz.UI.Grid.size = 1;

//keyboard entries
Genxyz.shift = false;
Genxyz.ctrl = false;
Genxyz.alt = false;
Genxyz.esc = false;

//this prevents getting new data. Useful when editing something.
Genxyz.preventUpdate = false;

//debug values go here.
Genxyz.Debug = new Array();
Genxyz.Debug['ShowPos'] = false;

Genxyz.nodes = new Array();
Genxyz.links = new Array();
Genxyz.layers = new Array();
Genxyz.layerLinks = new Array();

//Temp node data here.
Genxyz.tempNodes = new Array();

Genxyz.getZoom = function(){
    return Genxyz.zoom / 100;
}

Genxyz.getFont = function (sizeMod) {
    sizeMod = typeof sizeMod !== 'undefined' ? sizeMod : 1;
    return (Genxyz.fontSize * sizeMod + "px Arial");
}

Genxyz.getNodeHeight = function (sizeMod) {
    sizeMod = typeof sizeMod !== 'undefined' ? sizeMod : 1;
    return ((Genxyz.fontSize * sizeMod)* 2);
}



Genxyz.findGeneration = function(nodeIndex){
    //find select the node.
    var nodeID = Genxyz.nodes[nodeIndex].NodeID;

    var gen = 0;
    while (nodeID != null) {
        var linkIndex = Genxyz.findParentIndex(nodeID);
        //find out if this is a child or not.
        if (linkIndex== -1) {
            Genxyz.nodes[nodeIndex].Generation = gen;
            nodeID = null;
        } else {
            gen++;
            nodeID = Genxyz.links[linkIndex].OriginID;
        }
    }
    return gen;
}


Genxyz.countChildren = function (nodeID) {
    var nodeIndex = findNodeIndex(nodeID);
    if (nodeIndex == -1) {
        return;
    }
    var node = Genxyz.nodes[nodeIndex];
    var count = 0;
    //find all the children.
    
    var children = Genxyz.findChildren(nodeID);
    var i = 0;

    while (i < children.length && i < 50) {
        //scan for more children, until we run out.
        children.pushArray(Genxyz.findChildren(children[i]));
        children = children.filter(onlyUnique);
        i++;
    }

    return children.length;
}

//scan through for where the link is the "target" (the child) and go from there.
Genxyz.findParentIndex = function (nodeId, child) {
    child = typeof child !== 'undefined' ? child : true;
    var i = 0;
    while (i < Genxyz.links.length) {
        if (Genxyz.links[i].Type == "Parent" && ((child === true && Genxyz.links[i].TargetID === nodeId ) || (child === false && Genxyz.links[i].OriginID === nodeId))) {
            return i;
        }
        i++;
    }
    return -1;
}

Genxyz.findChildren = function (nodeId) {
    var children = [];
    for (var i = 0; i < Genxyz.links.length; i++){
        if (Genxyz.links[i].Type == "Parent" && Genxyz.links[i].OriginID == nodeId){
            children.push(Genxyz.links[i].TargetID);
        }
    }

    return children;
}

//generic only unique function.
function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}