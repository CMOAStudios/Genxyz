var canvas;
var ctx;
var arrowKeys = new Array(33, 34, 35, 36, 37, 38, 39, 40);
var subFolder = "";
if (window.location.href.indexOf("/Genxyz/") != -1) {
    subFolder = "/Genxyz";
}

$("document").ready(function () {
    //init some variables.
    Genxyz.instance = $("#instanceID").val();
    var forgeryToken = $("#AntiForgeryToken").text();
    //do some stuff.
    /*canvas = document.createElement('canvas');
    $("#GenxyzUI").append(canvas);
    */
    var height = $("#GenxyzUI").height();
    var width = $("#GenxyzUI").width();

    //create the materials that are used.
    Genxyz.Materials.CreateMaterials();

    //define scene data and add ligths.
    Genxyz.Gfx.Scene = new THREE.Scene();
    Genxyz.Gfx.Camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 3000);
    Genxyz.Gfx.Camera.translateZ(20);
    Genxyz.Gfx.Camera.userData.moveTween = null;
    Genxyz.Gfx.Camera.userData.rotTween = null;
    Genxyz.Gfx.AmbientLight = new THREE.AmbientLight(0xffffff, .2);
    Genxyz.Gfx.PointLight = new THREE.PointLight(0xffffff, 1, 1000, 1);
    Genxyz.Gfx.Scene.add(Genxyz.Gfx.AmbientLight);
    Genxyz.Gfx.Scene.add(Genxyz.Gfx.PointLight);

    //create a helper node.
    Genxyz.Gfx.HelperNode = new THREE.Mesh(Genxyz.Geometries.Node, Genxyz.Materials.TempNode);
    //hide it. 
    Genxyz.Gfx.HelperNode.visible = false;
    Genxyz.Gfx.Scene.add(Genxyz.Gfx.HelperNode);

    //create a helper plane.
    Genxyz.Gfx.HelperPlane = new THREE.Mesh(new THREE.PlaneBufferGeometry(2000, 2000, 8, 8), new THREE.MeshBasicMaterial({ visible: false }));
    Genxyz.Gfx.Scene.add(Genxyz.Gfx.HelperPlane);

    //create a grid.
    Genxyz.Gfx.GridHelper = new THREE.Object3D;
    Genxyz.Gfx.Scene.add(Genxyz.Gfx.GridHelper);
    Genxyz.Gfx.GridX = new THREE.GridHelper(20, 1);
    Genxyz.Gfx.GridX.material = Genxyz.Materials.GridX;
    Genxyz.Gfx.GridX.rotateX(Math.PI / 2);
    Genxyz.Gfx.GridY = new THREE.GridHelper(20, 1);
    Genxyz.Gfx.GridY.material = Genxyz.Materials.GridY;
    Genxyz.Gfx.GridY.rotateY(Math.PI/2);
    Genxyz.Gfx.GridZ = new THREE.GridHelper(20, 1);
    Genxyz.Gfx.GridZ.material = Genxyz.Materials.GridZ;
    Genxyz.Gfx.GridZ.rotateZ(Math.PI/2);
    Genxyz.Gfx.GridHelper.add(Genxyz.Gfx.GridX);
    Genxyz.Gfx.GridHelper.add(Genxyz.Gfx.GridY);
    Genxyz.Gfx.GridHelper.add(Genxyz.Gfx.GridZ);
 
    //the raycaster!
    Genxyz.Gfx.RayCaster = new THREE.Raycaster();
    Genxyz.Gfx.Renderer = new THREE.WebGLRenderer({ antialias: true });
    Genxyz.Gfx.Renderer.setSize(width, height);
    $("#GenxyzUI").append(Genxyz.Gfx.Renderer.domElement);

    Genxyz.Gfx.Camera.position.z = 10;

    Genxyz.UI.minX = 0;
    Genxyz.UI.minY = $("#genxyz-topBar").height();
    
    $(".textarea-autosize").autogrow({ flickering: false });
    $("#genxyz-rightClickMenu").hide();
    $("#genxyz-detailsMenu").hide();
    $("#loadingIcon").hide();
    $("#genxyz-help").dialog({ width: width / 2, height: height * .9, autoOpen:false, dialogClass: 'noTitleDialog' });

    Genxyz.Theme.ApplyThemes();

    render();
    redraw();

    Genxyz.UI.toggleSnap();
    Genxyz.UI.toggleDebug();
    Genxyz.UI.toggleGrid();

    window.onresize = function(){
        var width = $("#GenxyzUI").width();
        var height = $("#GenxyzUI").height();
        Genxyz.Gfx.Camera.aspect = width / height;
        Genxyz.Gfx.Camera.updateProjectionMatrix();
        Genxyz.Gfx.Renderer.setSize(width, height);
    };

    //set up ajax.
    $.ajaxSetup({
        data: {
            InstanceID: Genxyz.instance
        }
    });

    //get the initial data.
    $.post(subFolder + "/Instances/GetInitialData", {InstanceID: Genxyz.instance}, function (data) {
        //set nodes.
        Genxyz.nodes.length = 0;
        if (data.nodes != null) {
            Genxyz.nodes = data.nodes;
        }

        Genxyz.links.length = 0;
        if (data.links != null) {
            Genxyz.links = data.links;
        }

        Genxyz.layers.length = 0;
        if (data.layers != null) {
            Genxyz.layers = data.layers;
        }

        Genxyz.layerLinks.length = 0;
        if (data.links != null) {
            Genxyz.layerLinks = data.layerLinks;
        }

        for (var i = 0; i < Genxyz.layers.length; i++) {
            Genxyz.layers[i].layerLinks = [];
        }
        if (data.layerLinks != null) {
            for (var i = 0; i < data.layerLinks.length; i++) {
                var index = findLayerIndex(data.layerLinks[i].LayerID);
                if (index == -1) {
                    continue;
                }
                if (Genxyz.layers[index].layerLinks === undefined) {
                    Genxyz.layers[index].layerLinks = [];
                }
                Genxyz.layers[index].layerLinks.push(data.layerLinks[i]);
            }
        }
        //select the initial layer.
        Genxyz.LayerUI.SelectLayer(Genxyz.layers[0].LayerID);

        //start updates.
        var updates = setInterval(updateData, 100);

    });
});

function updateData() {

    //don't do anything if there is currently a pending update.
    if (!Genxyz.pendingUpdate) {
        //only tick after an update has been received.
        Genxyz.currentTick++;
        if (Genxyz.currentTick > Genxyz.currentTickTarget) {
            //Lock for updating.
            Genxyz.currentTick = 0;
            Genxyz.pendingUpdate = true;
            $.post(subFolder + "/Instances/GetUpdates", { InstanceID: Genxyz.instance }, function (data) {
                if (data.update == "true") {
                    if (data.nodes != null) {
                        updateNodes(data.nodes);
                    }
                    if (data.links != null) {
                        updateLinks(data.links);
                    }

                    if (data.layers != null) {
                        updateLayers(data.layers);
                    }

                    if (data.layerLinks != null) {
                        updateLayerLinks(data.layerLinks);
                    }
                    //unlock and reset to default values.
                    Genxyz.pendingUpdate = false;
                    Genxyz.currentTick = 0;
                    Genxyz.currentTickTarget = Genxyz.defaultTickTarget;
                } else {
                    //unlock, and let some more time pass before posting for another update.
                    Genxyz.pendingUpdate = false;
                    Genxyz.currentTick = 0;
                    Genxyz.currentTickTarget = Math.min(Genxyz.currentTickTarget * 2, Genxyz.maxTickTarget);
                }
            });
        }
    }
}

function updateNodes(nodes) {
    for (var i = 0; i < nodes.length; i++) {
        /*
        if (nodes[i].NodeID == Genxyz.selectedNode) {
            continue;
        }*/

        //now find the node.
        var node = nodes[i];
        var targetNode = findNodeIndex(node.NodeID);

        //add new node!
        if (targetNode == -1 && node.Active) {
            Genxyz.nodes.push(node);
            Genxyz.nodes[Genxyz.nodes.length - 1].pulseNew = 30;
            //now find a tmep node, if it exists, and delete it.
            var target = findTempNodeIndex(node.NodeID);
            if (target != -1) {
                Genxyz.tempNodes.splice(target, 1);
            }
        } else if (targetNode != -1 && !node.Active) {
            //delete node.
            //Genxyz.nodes.splice(targetNode, 1);
            //newer, fancier way of doing it.
            Genxyz.nodes[targetNode].delete = true;
            Genxyz.nodes[targetNode].pulseDelete = 60;
        } else if (targetNode != -1 && node.Active) {
            //update node.
            updateNodeUI(targetNode, node);
        }
    }
}

function updateLinks(links) {
    for (var i = 0; i < links.length; i++) {
        //for now just find and update links where required, and hide them where required.
        var link = links[i];

        var targetLink = findLinkIndex(link.LinkID);
        if (targetLink == -1 && link.Active) {
            Genxyz.links.push(link);
        } else if (targetLink != -1 && !link.Active) {
            Genxyz.links.splice(targetLink, 1);
        } else if (targetLink != -1 && link.Active) {
            Genxyz.links[targetLink] = link;
        }
    }
}

function updateLayers(layers) {
    for (var i = 0; i < layers.length; i++) {
        var layer = layers[i];

        var targetLayer = findLayerIndex(layer.LayerID);
        if (targetLayer == -1 && layer.Active == true) {
            Genxyz.layers.push(layer);
        } else if (targetLayer != -1 && layer.Active == false) {
            Genxyz.layers.splice(i, 1);
        } else if (targetLayer != -1 && layer.Active == true) {
            Genxyz.layers[targetLayer] = layer;
        }
    }
}

function updateLayerLinks(layerLinks) {
    for (var i = 0; i < layerLinks.length; i++) {
        var layerLink = layerLinks[i];

        //first find the layer it belongs to.
        var parentLayer = findLayerIndex(layerLink.LayerID);
        if (parentLayer == -1) {
            continue;
        } else {
            var targetLayerLink = findLayerLinkIndex(layerLink.LayerID, layerLink.LayerLinkID);
            //alert(layerLink.Active);
            if (targetLayerLink == -1 && layerLink.Active == true) {
                if (Genxyz.layers[parentLayer].layerLinks == undefined) {
                    Genxyz.layers[parentLayer].layerLinks = [];
                }
                Genxyz.layers[parentLayer].layerLinks.push(layerLink);
            } else if (targetLayerLink != -1 && layerLink.Active == false) {
                //don't do anything for now. It just won't draw. we can clean this up later.
                //Genxyz.layers[parentLayer].layerLinks.splice(targetLayerLink, 1);
            } else if (targetLayerLink != -1 && layerLink.Active == true) {
                Genxyz.layers[parentLayer].layerLinks[targetLayerLink] = layerLink;
            }
        }
    }
}

function findNodeIndex(id) {
    var targetNode = -1;
    var i = -1;
    //find the appropriate node.
    while (i < Genxyz.nodes.length -1 && targetNode == -1) {
        i++;
        if (Genxyz.nodes[i].NodeID == id) {
            targetNode = i;
        }
    }
    return targetNode;
}

//related to the above but for temp nodes.
function findTempNodeIndex(id) {
    var targetNode = -1;
    var i = -1;
    while (i < Genxyz.tempNodes.length - 1 && targetNode == -1) {
        i++;
        if (Genxyz.tempNodes[i].NodeID == id) {
            targetNode = i;
        }
    }
    return targetNode;
}

function findLinkIndex(id) {
    var targetLink = -1;
    var i = -1;
    while (i < Genxyz.links.length -1 && targetLink == -1) {
        i++;
        if (Genxyz.links[i].LinkID == id) {
            targetLink = i;
        }
    }
    return targetLink;
}

//sends an update to a node.
function updateNode(node) {
    $.post(subFolder + "/Nodes/UpdateNode", $.param(node), function (data) {
        if (!checkForErrorsGenxyz(data)) {
            //find the gen and keep it in place.
            var gen = Genxyz.nodes[findNodeIndex(data.NodeID)].Generation;
            Genxyz.nodes.splice(findNodeIndex(data.NodeID), 1);
            data.Generation = gen;
            Genxyz.nodes.push(data);
        }
    });
}

function updateNodeUI(index, target) {
    //find the node.
    var node = Genxyz.nodes[index];
    //for now, just change the position rather than have any fancy transitions.
    node.xPos = target.xPos;
    node.yPos = target.yPos;
    node.zPos = target.zPos;

    //now find the model and update it.
    var model = Genxyz.Gfx.Scene.getObjectById(node.modelID);
    model.position.set(node.xPos, node.yPos, node.zPos);

    //now find if there are any lines, and if so, they need to be redrawn.
    updateLinkRenderByNode(node.NodeID);

    if (node.Name != target.Name) {
        node.Name = target.Name;
        node.pulseUpdate = 60; //deprecated... for now.
    }
    node.Comments = target.Comments;
    Genxyz.nodes[index] = node;
}

function findLayerIndex(layerID) {
    var i = 0;
    while (i < Genxyz.layers.length) {
        if (Genxyz.layers[i].LayerID == layerID) {
            return i;
        }
        i++;
    }
    return -1;
}

function findLayerLinkIndex(layerID, layerLinkID) {
    var i = 0;
    var targetLayer = findLayerIndex(layerID);
    if (targetLayer == -1) {
        return -2;
    } else {
        if (Genxyz.layers[targetLayer].layerLinks !== undefined) {
            while (i < Genxyz.layers[targetLayer].layerLinks.length) {
                if (Genxyz.layers[targetLayer].layerLinks[i].LayerLinkID == layerLinkID) {
                    return i;
                }
                i++;
            }
        }
        return -1;
    }
}

function findLinks(nodeID) {
    var links = {};
    links.parents = [];
    links.children = [];
    links.siblings = [];
    for (var i = 0; i < Genxyz.links.length; i++) {
        if (Genxyz.links[i].Type == "Sibling") {
            if (Genxyz.links[i].OriginID == nodeID || Genxyz.links[i].TargetID == nodeID) {
                links.siblings.push(Genxyz.links[i]);
            }
        } else {
            if (Genxyz.links[i].OriginID == nodeID) {
                links.children.push(Genxyz.links[i]);
            } else if (Genxyz.links[i].TargetID == nodeID) {
                links.parents.push(Genxyz.links[i]);
            }
        }
    }

    if (links.parents.length == 0 && links.children.length == 0 && links.siblings.length == 0) {
        return null;
    }
    return links;
}

//removes any care whether a link is parent, child or sibling.
function findLinksFlat(nodeID) {
    var l = findLinks(nodeID);
    if (l == null) {
        return null;
    }
    var links = [];
    links.pushArray(l.parents);
    links.pushArray(l.children);
    links.pushArray(l.siblings);
    return links;
}

function getName(nodeID) {
    var nodeIndex = findNodeIndex(nodeID);
    if (nodeIndex == -1)
    {
        AddGenxyzError("Unable to locate node " + nodeID);
        return;
    }
    return Genxyz.nodes[nodeIndex].Name;
}

//disable form submits.
$("form").submit(function () {
    return false;
});

window.onscroll = function () { window.scrollTo(0, 0); };

function findRenderNodeByNodeID(nodeID) {
    var index = findNodeIndex(nodeID);
    if (index == -1) {
        return -1;
    }
    var modelID = Genxyz.nodes[index].modelID;
    return modelID;
}
