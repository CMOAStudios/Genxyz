Genxyz.UI.toggleLayerMenu = function (e) {
    Genxyz.LayerUI.populate();
    $("#genxyz-layerMenu").toggle().css({
        top: Math.max(Genxyz.mouseY, Genxyz.UI.minY) + "px",
        left: Math.max(Genxyz.mouseX, Genxyz.UI.minX) + "px"
    });
    Genxyz.UI.toggleIcon($("#layersIcon"), $("#genxyz-layerMenu").is(":visible"));
}

Genxyz.UI.toggleFilterLayersMenu = function (e) {
    Genxyz.LayerUI.populate();
    $("#genxyz-filterLayerMenu").toggle().css({
        top: Math.max(Genxyz.mouseY, Genxyz.UI.minY) + "px",
        left: Math.max(Genxyz.mouseX, Genxyz.UI.minX) + "px"
    });
    Genxyz.UI.toggleIcon($("#filterLayersIcon"), $("#genxyz-filterLayerMenu").is(":visible"));
}

Genxyz.UI.toggleEditLayerMenu = function (e) {
    $("#genxyz-editLayer").toggle().css({
        top: Math.max(Genxyz.mouseY, Genxyz.UI.minY) + "px",
        left: Math.max(Genxyz.mouseX, Genxyz.UI.minX) + "px"
    });
}

Genxyz.UI.toggleHelp = function (e) {
    if ($("#genxyz-help").dialog("isOpen") == false) {
        $("#genxyz-help").dialog("open");
    } else {
        $("#genxyz-help").dialog("close");
    }
}

Genxyz.UI.toggleSnap = function (e) {
    Genxyz.UI.Snap = !Genxyz.UI.Snap;
    Genxyz.UI.toggleIcon($("#snapIcon"), Genxyz.UI.Snap);
}

Genxyz.UI.toggleGrid = function (e) {
    Genxyz.UI.ShowGrid = !Genxyz.UI.ShowGrid;
    Genxyz.Gfx.GridHelper.visible = Genxyz.UI.ShowGrid;
    Genxyz.UI.toggleIcon($("#gridIcon"), Genxyz.UI.ShowGrid);
}

Genxyz.UI.toggleDebug = function (e) {
    Genxyz.UI.Debug = !Genxyz.UI.Debug;
    if (Genxyz.UI.Debug) {
        $("#genxyz-debug").fadeIn();
    } else {
        $("#genxyz-debug").fadeOut();
    }
    Genxyz.UI.toggleIcon($("#debugIcon"), Genxyz.UI.Debug);
}

Genxyz.UI.toggleIcon = function(target, state){
    if (state) {
        $(target).addClass("activeIcon");
    } else {
        $(target).removeClass("activeIcon");
    }
}

function FindInLayer(nodeID, layerID) {
    var layerIndex = findLayerIndex(layerID);
    if (layerIndex == -1) {
        return false;
    }
    var layer = Genxyz.layers[layerIndex].layerLinks;
    if (layer !== undefined) {
        for (var l = 0; l < layer.length; l++) {
            if (nodeID == layer[l].NodeID) {
                return true;
            }
        }
    }
    return false;
}

Genxyz.LayerUI.SelectLayer = function (layerID) {
    //find the layer.
    var index = findLayerIndex(layerID);
    if (index == -1) {
        Genxyz.LayerUI.activeLayer = null;
    } else {
        Genxyz.LayerUI.activeLayer = layerID;
        console.log(Genxyz.layers[index].Name);
        $("#currentLayerName").html(Genxyz.layers[index].Name);
        clearPathRender();
    }
}

Genxyz.LayerUI.NextLayer = function(fwd){
    var index = findLayerIndex(Genxyz.LayerUI.activeLayer);
    if (index == -1) {
        return;
    }
    //find the amount of layers.
    var layerCount = Genxyz.layers.length-1;
    if (fwd) {
        console.log(layerCount);
        index++;
        if (index > layerCount) {
            console.log(index);
            index = 0;
        }
    } else {
        index--;
        if (index < 0) {
            index = layerCount;
        }
    }

    Genxyz.LayerUI.SelectLayer(Genxyz.layers[index].LayerID);
    Genxyz.LayerUI.populate();
}


//populate the layer UI.
Genxyz.LayerUI.populate = function () {
    $("#genLayerList").html("");
    var gens = [];
    //now find the amount of generations.
    for (var i = 0; i < Genxyz.nodes.length; i++) {
        gens.push(Genxyz.findGeneration(i));
    }
    gens.sort(function (a, b) { return a - b });
    //filter to unique generations.
    var myGens = gens.filter(onlyUnique);
    var htmlToAppend = "";
    //once that's done, creating the text for them.
    for (var x = 0; x < myGens.length; x++) {
        //find if this is an active layer for generations.
        var selected = (Genxyz.LayerUI.activeGenLayers.indexOf(myGens[x]) != -1);
        htmlToAppend += "<span class='lineItem'>";
        htmlToAppend += "<span class='generationLayer layerItem' data-selected='" + selected + "' data-value='" + myGens[x] + "'> " + (myGens.length > 9 && myGens[x] < 10 ? "0" : "") + myGens[x] + "</span>";
        htmlToAppend += "</span>";
    }
    /*for (var i = 0; i < Genxyz.LayerUI.activeGenLayers.length; i++) {
        console.log(Genxyz.LayerUI.activeGenLayers[i]);
    }*/
    $("#genLayerList").html(htmlToAppend);

    //now do the same for non-generation layers.
    htmlToAppend = "";
    
    for (var x = 0; x < Genxyz.layers.length; x++) {
        var selected = (Genxyz.LayerUI.selectedLayers.indexOf(Genxyz.layers[x].LayerID) != -1);
        var active = (Genxyz.LayerUI.activeLayer == Genxyz.layers[x].LayerID);
        htmlToAppend += "<span class='lineItem'>";
        htmlToAppend += "<span class='layerItem viewLayer' data-selected='" + selected + "' data-value='" + Genxyz.layers[x].LayerID + "'> <i class='fa fa-eye'> </i></span>";
        htmlToAppend += "<span class='layerItem selectLayer' data-active='" + active + "' data-value='" + Genxyz.layers[x].LayerID + "'> " + Genxyz.layers[x].Name + "</span>";
        htmlToAppend +="</span>";
    }

    $("#definedLayerList").html(htmlToAppend);
    //$("#layerList").html(secondHtmlToAppend);
}

//click the icon or text to add a new / . Hide the previous box when doing this.
$("#openNewLayerMenu").click(function (e) {
    Genxyz.UI.toggleFilterLayersMenu();
    $("#genxyz-newLayer").show().css({
        top: Math.max(e.clientY,Genxyz.UI.minY) + "px",
        left: Math.max(e.clientX,Genxyz.UI.minX) + "px"
    });

    $("#genxyz-newLayer input[type=text]").val('').focus();
});

//edit layer.
$("#currentLayerName").click(function (e) {
    $("#delete-Container").hide();
    Genxyz.UI.toggleEditLayerMenu(e);
    $("#genxyz-editLayer input[type=text]").val($(e.target).text());
    $("#genxyz-editLayer #LayerID").val(Genxyz.LayerUI.activeLayer);
    if (Genxyz.layers.length > 1) {
        $("#delete-Layer").show();
    } else {
        $("#delete-Layer").hide();
    }
});

$("#edit-Layer").click(function (e) {
    $("#currentLayerName").text($("#genxyz-editLayer #Name").val());
    //hide the delete button if there is only one layer.
    if (Genxyz.layers.length > 0) {
        $("#delete-Layer").show();
    } else {
        $("#delete-Layer").hide();
    }
});

$("#confirmLayerDelete").click(function (e) {
    if ($(this).prop('checked')) {
        $("#delete-Layer").show();
    } else {
        $("#delete-Layer").hide();
    }
});

$("#delete-Layer").click(function (e) {
    $("#delete-Container").show();
});

$("#delete-layer-confirm").click(function (e) {
    //there is some overlap here, but in this case, it must be custom.
    var form = $(e.target).closest("form");
    Genxyz.LayerUI.NextLayer(true);
    $.post("/Nodes/DeleteLayer/", form.serialize(), function (data) {
        if (!checkForErrorsGenxyz(data)) {
            $(e.target).closest("div").hide(100);
            Genxyz.layers[findLayerIndex(data.layer.LayerID)].layerLinks.length = 0;
            Genxyz.layers.splice(findLayerIndex(data.layer.LayerID), 1);
        }
    });
});

//layer stuff! first genrational.
$("#genLayerList").on("click", $(".generationLayer"), function (data) {
    $(data.target).attr("data-selected", ($(data.target).attr("data-selected") == "false"));
    var selected = $(data.target).attr("data-selected");
    var val = parseInt($(data.target).attr("data-value"));
    var i = Genxyz.LayerUI.activeGenLayers.indexOf(val);
    if (i == -1 && selected == "true") {
        Genxyz.LayerUI.activeGenLayers.push(val);
    } else if (i != -1) {
        Genxyz.LayerUI.activeGenLayers.splice(i, 1);
    }
});

//repeat above but for defined layers.
$("#definedLayerList").on("click", ".viewLayer", function (e) {
    var target = $(this);

    target.attr("data-selected", (target.attr("data-selected") == "false"));
    var selected = target.attr("data-selected");
    var val = parseInt(target.attr("data-value"));
    var i = Genxyz.LayerUI.selectedLayers.indexOf(val);
    if (i == -1 && selected == "true") {
        Genxyz.LayerUI.selectedLayers.push(val);
    } else if (i != -1) {
        Genxyz.LayerUI.selectedLayers.splice(i, 1);
    }
    //Genxyz.LayerUI.populate();
    clearPathRender();
});

//toggles all layers.
$(".toggleAllLayers").click(function (e) {
    //count the layers. if all are selected, hide.
    if ($(".viewLayer").length - $(".viewLayer[data-selected='true']").length == 0) {
        $(".viewLayer").each(function(t, obj){$(obj).trigger("click")});
    } else {
        $(".viewLayer:not([data-selected='true'])").each(function (t, obj) {$(obj).trigger("click") });
    }
});

//this will change the active layer, as well always display the active layer.
$("#definedLayerList").on("click", ".selectLayer", function (data) {
    var thisLayer = $(data.target);

    //only do something if this layer is *not* selected.
    if (thisLayer.attr("data-value") != Genxyz.LayerUI.activeLayer) {
        Genxyz.LayerUI.SelectLayer(thisLayer.attr("data-value"));
        //remove those that have "active value" set.
        $(".selectLayer").attr("data-active", false);
        thisLayer.attr("data-active", true);
    }

    //Genxyz.UI.toggleLayerMenu();
});

function updateNodeDetails(NodeID) {
    updateEditNode(NodeID);
    updateLinksNode(NodeID);
}

function updateEditNode(NodeID) {
    var editMenu = $("#genxyz-editMenu");
    var GenxyzID = findNodeIndex(NodeID);
    if (GenxyzID == -1) {
        return;
    }
    var node = Genxyz.nodes[GenxyzID];
    var layers = [];
    for (var i = 0; i < Genxyz.layers.length; i++) {
        if (FindInLayer(node.NodeID, Genxyz.layers[i].LayerID)) {
            layers.push(Genxyz.layers[i].Name);
        }
    }
    editMenu.find("#genxyz-editNode-layerList").text("");
    for (var x = 0; x < layers.length; x++) {
        var currText = editMenu.find("#genxyz-editNode-layerList").text();
        editMenu.find("#genxyz-editNode-layerList").text(currText + layers[x] + (x < layers.length - 1 ? ", " : ""));
    }
    editMenu.find("#InstanceID").val(Genxyz.instance);
    editMenu.find("#NodeID").val(NodeID);
    editMenu.find("#xPos").val(node.xPos);
    editMenu.find("#yPos").val(node.yPos);
    editMenu.find("#zPos").val(node.zPos);
    editMenu.find(".NodeID").text(NodeID);
    editMenu.find("#Name").val(node.Name);
    editMenu.find("#Comments").val(node.Comments);
    /*
    var myLinks = findLinks(Genxyz.selectedNode);
    $("#Genxyz-editNode-linkList").html("");
    if (myLinks == null){
        $("#genxyz-editNode-linkListParent").hide();
    } else {
        $("#genxyz-editNode-linkListParent").show();
        if (myLinks.parents.length > 0) {
            $("#Genxyz-editNode-linkList").append("<br />Parents:");
            for (var i = 0; i < myLinks.parents.length; i++) {
                $("#Genxyz-editNode-linkList").append(AddLinkText(node.Name, getName(myLinks.parents[i].OriginID), myLinks.parents[i].LinkID, false, false));
            }
        }

        if (myLinks.children.length > 0) {
            $("#Genxyz-editNode-linkList").append("<br />");
            $("#Genxyz-editNode-linkList").append("<br />Children:");
            for (var i = 0; i < myLinks.children.length; i++) {
                $("#Genxyz-editNode-linkList").append(AddLinkText(node.Name, getName(myLinks.children[i].TargetID), myLinks.children[i].LinkID, false, true));
            }
        }

        if (myLinks.siblings.length > 0) {
            $("#Genxyz-editNode-linkList").append("<br />");
            $("#Genxyz-editNode-linkList").append("<br />Symbolic Links:");
            for (var i = 0; i < myLinks.siblings.length; i++) {
                //find out if this is the "parent" or "Child".
                if (myLinks.siblings[i].OriginID == node.NodeID) {
                    $("#Genxyz-editNode-linkList").append(AddLinkText(node.Name, getName(myLinks.siblings[i].TargetID), myLinks.siblings[i].LinkID, true, true));
                } else {
                    $("#Genxyz-editNode-linkList").append(AddLinkText(node.Name, getName(myLinks.siblings[i].OriginID), myLinks.siblings[i].LinkID, true, true));
                }
            }
        }
    }*/
}

function updateLinksNode(NodeID) {
    //first find a list of all links.
    var index = findNodeIndex(NodeID);
    if (index == -1) {
        return;
    }
    var node = Genxyz.nodes[index];
    var parentLinks = $("#genxyz-parentLinksMenu").find(".genxyz-detailsSubMenuContent");
    var childLinks = $("#genxyz-childLinksMenu").find(".genxyz-detailsSubMenuContent");
    var symbolicLinks = $("#genxyz-symbolicLinksMenu").find(".genxyz-detailsSubMenuContent");
    parentLinks.html("");
    symbolicLinks.html("");
    childLinks.html("");
    $("#genxyz-symbolicLinksMenu").hide();
    $("#genxyz-parentLinksMenu").hide();
    $("#genxyz-childLinksMenu").hide();
    var links = findLinks(NodeID);
    if (links == null) {

        return;
    }

    if (links.siblings.length > 0){
        for (var i = 0; i < links.siblings.length; i++){
            if (links.siblings[i].OriginID == NodeID) {
                symbolicLinks.append(AddLinkText(getName(links.siblings[i].TargetID), links.siblings[i].LinkID));
            } else {
                symbolicLinks.append(AddLinkText(getName(links.siblings[i].OriginID), links.siblings[i].LinkID));
            }
        }
    }
    if (links.parents.length > 0) {
        for (var i = 0; i < links.parents.length; i++) {
            parentLinks.append(AddLinkText(getName(links.parents[i].OriginID), links.parents[i].LinkID));
        }
    }

    if (links.children.length > 0) {
        for (var i = 0; i < links.children.length; i++) {
            childLinks.append(AddLinkText(getName(links.children[i].TargetID), links.children[i].LinkID));
        }
    }

    //show if either are not empty.
    if (parentLinks.html() != "") {
        $("#genxyz-parentLinksMenu").show();
    }
    if (symbolicLinks.html() != "") {
        $("#genxyz-symbolicLinksMenu").show();
    }
    if (childLinks.html() != "") {
        $("#genxyz-childLinksMenu").show();
    }
}

//save the node.
$("#genxyz-editNode-save").click(function (e) {
    if ($(this).hasClass("disabled") === false) {
        var editMenu = $("#genxyz-editMenu");
        var nodeID = editMenu.find("#NodeID").val()
        var form = $("#genxyz-editNode-save").closest("form");
        var nodeTarget = findNodeIndex(nodeID);
        //save the current node so we can restore it if it's problematic.
        var node = Genxyz.nodes[nodeTarget];
        var text = setLoadingButton(e);
        $.post("/Nodes/UpdateNode", form.serialize(), function (data) {
            if (checkForErrorsGenxyz(data)) {
                Genxyz.nodes[nodeTarget] = node;
            }
            clearLoadingButton(e, text);
        }).fail(function (data) {
            Genxyz.nodes[nodeTarget] = node;
        });

        //now update the node.
        Genxyz.nodes[nodeTarget].Name = editMenu.find("#Name").val();
        Genxyz.nodes[nodeTarget].Comments = editMenu.find("#Comments").val();
    }
});

function checkForErrorsGenxyz(data) {
    if (data.error) {
        for (i = 0; i < data.error.length; i++) {
            if (data.error[i].value == undefined) {
                return true;
            }
            for (x = 0; x < data.error[i].value.length; x++) {
                AddGenxyzError(data.error[i].value[x])
            }
        }
        return true;
    }
    return false;
}

//prints messages.
function AddError(htmlTarget, error) {
    htmlTarget.first(".errors").html(error);
}

//prints messages.
function AddMessage(htmlTarget, message) {
    htmlTarget.first(".messages").html(error);
}


function AddGenxyzError(message) {
    if (Genxyz.UI.Errors.length > 9) {
        Genxyz.UI.Errors.splice(0, 1);
    }
    error = {};
    error.message = message;
    error.ttl = 200;
    Genxyz.UI.Errors.push(error);
}

function AddLinkText(linkedNode, id) {
    var text = '<span class="itemListing">' + linkedNode;

    text += '<span class="genxyz-icon deleteLinkIcon" data-targetID=' + id +'><i class="fa fa-trash-o"></i></span></span><br>'
    return text;
}

$("#genxyz-detailsContainer").on("click", ".deleteLinkIcon", function (e) {
    var tar = $(e.currentTarget).attr("data-targetID");
    //find link id.
    var linkIndex = findLinkIndex(tar);
    if (linkIndex == -1) {
        return;
    }
    var link = Genxyz.links[linkIndex];
    Genxyz.links.splice(linkIndex, 1);
    updateNodeDetails($("#genxyz-editMenu").find("#NodeID").val());
    $.post(subFolder + "/Nodes/RemoveLink", { LinkID: tar }, function (data) {
        Genxyz.Gfx.Scene.remove(Genxyz.Gfx.Scene.getObjectById(link.modelID));
        link.modelID = null;
    }).fail(function(data){
        Genxyz.links.push(link);
        updateNodeDetails($("#genxyz-editMenu").find("#NodeID").val());
    });
});

$("#deleteNodeMenu").click(function (e) {
    $("#deleteNodeConfirm").show();
});

$("#deleteNodeConfirm").click(function (e) {
    var instanceID = $("#instanceID").val();
    $("#deleteNodeConfirm").hide();
    var nodeIDs = Genxyz.selectedNodes.slice();
    while (Genxyz.selectedNodes.length > 0){
        var nodeIndex = findNodeIndex(Genxyz.selectedNodes[0]);
        var myNode = Genxyz.nodes[nodeIndex];
        var myLinks = findLinksFlat(Genxyz.selectedNodes[0]);
        if (myLinks != null) {
            // now delete the links.
            for (var i = 0; i < myLinks.length; i++) {
                var index = findLinkIndex(myLinks[i].LinkID);
                Genxyz.Gfx.Scene.remove(Genxyz.Gfx.Scene.getObjectById(myLinks[i].modelID));
                myLinks[i].modelID = null;
                Genxyz.links.splice(findLinkIndex(myLinks[i].LinkID), 1);
            }
        }
        //now take out the model here too.
        deselectNode(Genxyz.selectedNodes[0]);
        var obj = Genxyz.Gfx.Scene.getObjectById(myNode.modelID);
        Genxyz.Gfx.Scene.remove(obj);
        myNode.modelID = null;
        Genxyz.nodes.splice(nodeIndex, 1);
    }

    CloseMenus();
    $.post(subFolder + "/Nodes/DeleteNodes", { NodeIDs: nodeIDs, InstanceID: instanceID }, function (data) {
        if (!checkForErrorsGenxyz(data)) {

        } else {
            Genxyz.nodes.push(myNode);
            if (myLinks != null) {
                Genxyz.links.pushArray(myLinks);
            }
        }
    }).fail(function(data){
        AddGenxyzError("Server error.");
        Genxyz.nodes.push(myNode);
        if (myLinks != null) {
            Genxyz.links.pushArray(myLinks);
        } 
    });
});

$("#createLayerConfirm").click(function (e) {
    $("#genxyz-newLayer").hide();
    $.post(subFolder + "/Nodes/CreateLayer", { Name: $("#newLayerName").val() }, function (data) {
        if (!checkForErrorsGenxyz(data)) {
            var layerID = data.layer.LayerID;
            Genxyz.layers.push(data.layer);
            $("#loadingIcon").hide();
        }
    }).fail(function (data) {
        AddGenxyzError("Server error.");
    });
});

$("#createPathFromNodes").click(function (e) {
    $("#loadingIcon").show();
    //Create layer based on the first node's name.
    var firstID = Genxyz.selectedNodes[0];
    var nodeName = Genxyz.nodes[findNodeIndex(firstID)].Name;
    $("#genxyz-rightClickMenu").slideUp(100);
    $.post(subFolder + "/Nodes/CreatePath", { Name: nodeName, Nodes: Genxyz.selectedNodes }, function (data) {
        if (!checkForErrorsGenxyz(data)) {
            var layerID = data.layer.LayerID;
            Genxyz.layers.push(data.layer);
            Genxyz.layers[findLayerIndex(layerID)].layerLinks = data.layerLinks;
            $("#loadingIcon").hide();
        }
    }).fail(function(data){
        AddGenxyzError("Server error.");
    });
});

$("#addNodesToPath").click(function (e) {
    $("#loadingIcon").show();
    if (Genxyz.selectedNodes.length == 0) {
        return;
    }
    $.post(subFolder + "/Nodes/AssignLayer", { NodeID: Genxyz.selectedNodes, LayerID: Genxyz.LayerUI.activeLayer }, function (data) {
        if (!checkForErrorsGenxyz(data)) {
            //stuff?
        }
        $("#loadingIcon").hide();
    });
});

$(".node-input").focusout(function (e) {
    if (!Genxyz.esc) {
        submitNode(e);
    }
});

$(".node-input").keyup(function (e) {
    if (e.keyCode == 13) {
        if (e.ctrlKey) {
            $(this).attr("hide", false);
        }
        $(this).val($(this).val().trim())
        submitNode(e);
    }
})

function showRightClickMenu(e) {
    //shows right click menu.

    //hide content first.
    $(".right-click-menu").hide();
    $("#deleteNodeConfirm").hide();
    $("#genxyz-rightClickMenu").show().css({
        left: e.pageX,
        top: e.pageY
    });
}

function updateDebug() {
    var grid = Genxyz.Gfx.GridHelper;
    var camera = Genxyz.Gfx.Camera;
    $("#cameraX").html(camera.position.x);
    $("#cameraY").html(camera.position.y);
    $("#cameraZ").html(camera.position.z);

    $("#cameraRotX").html(camera.rotation.x * (180/Math.PI ));
    $("#cameraRotY").html(camera.rotation.y * (180 / Math.PI));
    $("#cameraRotZ").html(camera.rotation.z * (180 / Math.PI));

    $("#gridX").html(grid.position.x);
    $("#gridY").html(grid.position.y);
    $("#gridZ").html(grid.position.z);
}