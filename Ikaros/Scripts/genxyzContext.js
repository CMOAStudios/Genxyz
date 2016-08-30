$("document").ready(function () {
    $("#GenxyzUI").contextmenu(function (e) {
        //prevent the default context menu.
        e.preventDefault();
    });
    
    $(".genxyz-menu").contextmenu(function (e) {
        e.preventDefault();
    });

    $(".genxyz-menu li").click(function (e) {

        if ($(this).attr("data-action")) {
            // This is the triggered action name
            switch ($(this).attr("data-action")) {
                case "createNode":
                    createNode(e);
                    break;
                case "deleteNode":
                    deleteNode(e);
                    break;
                case "parentLink":
                    createLink(e, "Parent");
                    break;
                case "siblingLink":
                    createLink(e, "Sibling");
                    break;
                case "removeLinks":
                    removeLinks(e);
                    break;
                case "assignLayer":
                    assignLayer(e);
                    break;
            }

            // Hide it AFTER the action was triggered
        }
        $(this).closest(".genxyz-menu").finish().hide(100);
    });

    //submit on enter.
    $(".submit-enter").keyup(function (e) {
        console.log(e.keyCode === 13);
        if (e.keyCode === 13) {
            var form = $(e.target).closest("form");
            $.post($(e.target).attr("data-target"), form.serialize(), function (data) {
                if (!checkForErrorsGenxyz(data)) {
                    $(e.target).val("");
                    $(e.target).closest("div").hide(100);
                }
            });
        }
    });
});

function removeLinks(trigger) {
    $("#genxyz-menu").finish().hide(100);
    $.post(subFolder + "/Nodes/RemoveLinks", { nodeId: Genxyz.selectedNode, InstanceID: $("#instanceID").val() }, function (data) {
        if (!checkForErrors(data)) {
            //stuff for errors here.
        }
    }).fail(function (e) {
        AddGenxyzError(e.status + ": " + e.statusText);
    });
}

function deleteNode(trigger) {
    $("#genxyz-menu").finish().hide(100);
    $("#genxyz-deleteMenu").first("#NodeID").val(Genxyz.selectedNode);
    $("#genxyz-deleteMenu").first("#InstanceID").val($("#instanceID").val());
    $("#genxyz-subMenu").html($("#genxyz-deleteMenu").html());
    showSubMenu(trigger);
}

//submits a node.
function submitNode(e) {
    var container = $("#genxyz-input-container");
    //node specific stuff.
    var node = {};
    var form = $(e.target).closest("form");
    var target = $(e.target).attr("data-target");
    if (target === undefined) {
        target = form.attr('action');
    }

    tempNodeID = (Genxyz.tempNodes.length);
    node.xPos = container.find("#xPos").val();
    node.yPos = container.find("#yPos").val();
    node.Name = container.find("#Name").val();
    node.NodeID = tempNodeID;

    Genxyz.tempNodes.push(node);
    $.post(target, form.serialize(), function (data) {
        Genxyz.tempNodes.splice(findTempNodeIndex(tempNodeID), 1);
        if (!checkForErrorsGenxyz(data)) {
            Genxyz.nodes.push(data.node);
            Genxyz.layers[findLayerIndex(data.layerlink.LayerID)].layerLinks.push(data.layerlink);
            if (data.link != null) {
                Genxyz.links.push(data.link);
            }
            if (e.ctrlKey) {
                Genxyz.selectedNode = data.node.NodeID;
                $("#genxyz-input-container").find("#ParentNodeID").val(Genxyz.selectedNode);
            }
        }
    }).fail(function (e) {
        Genxyz.tempNodes.splice(findTempNodeIndex(tempNodeID), 1);
        AddGenxyzError(e.status + ": " + e.statusText);
    });
    $(e.target).val("");
    if (e.ctrlKey || e.shiftKey) {
        var container = $("#genxyz-input-container");

        //figure out the direction to move it to.
        //using the location of the original parent, if applicable, and then going from there...
        var hrz = Genxyz.mouseX - $("#GenxyzUI").width() / 2;
        var ver = Genxyz.mouseY - $("#GenxyzUI").height() / 2;
        var myXPos = parseInt(container.find("#xPos").val(), 10);
        var myYPos = parseInt(container.find("#yPos").val(), 10);
        if (Math.abs(hrz) > Math.abs(ver)) {
            //horizontal.
            if (hrz >= 0) {
                myXPos += Genxyz.UI.Grid.xSize*2;
            } else {
                myXPos += -Genxyz.UI.Grid.xSize*2;
            }
        } else {
            //vertical.
            if (ver >= 0) {
                myYPos += Genxyz.UI.Grid.ySize * 2;
            } else {
                myYPos += -Genxyz.UI.Grid.ySize * 2;
            }
        }

        container.find("#yPos").val(myYPos);
        container.find("#xPos").val(myXPos);

    } else {
        $(".pushDirData").val("");
        $(e.target).closest("div").hide(100);
    }
}

//links
function createLink(trigger, target) {
    $("#genxyz-menu").finish().hide(100);
    console.log(subFolder);
    $.post(subFolder + "/Nodes/CreateLink", { OriginID: Genxyz.selectedNode, TargetID: Genxyz.targetedNode, Type: target }, function (data) {
        if (data.error) {
            alert(data.error[0].value);
        }
        //silent success is good.
    }).fail(function (e) {
        AddGenxyzError(e.status + ": " + e.statusText);
    });
}

function showSubMenu(trigger) {
    $("#genxyz-subMenu").toggle(100).
    css({
        top: trigger.pageY + "px",
        left: trigger.pageX + "px"
    });
}

function assignLayer(trigger) {
    $.post(subFolder + "/Nodes/AssignLayer", { NodeID: Genxyz.selectedNode, LayerID: Genxyz.LayerUI.activeLayer, InstanceID: $("#instanceID").val() }, function (data) {
        if (!checkForErrorsGenxyz(data)){
            //stuff i guess.
        }
    });
}

//clicks on "Post Create Node".
$("#genxyz-subMenu").on("click", "#PostCreateNode", function (data) {
    var form = $("#PostCreateNode").closest("form");
    $.post("/Nodes/CreateNode", form.serialize(), function (data) {
        if (data.error) {
            AddError(form, data.error);
        }
        CloseMenus();
        Genxyz.nodes.push(data);
    }).fail(function (e) {
        AddGenxyzError(e.status + ": " + e.statusText);
    });
});

//Clicks on "Post Delete Node".
$("#genxyz-subMenu").on("click", "#PostDeleteNode", function (data) {
    var nodeID = Genxyz.selectedNode;
    var instanceID = $("#instanceID").val();
    $.post(subFolder + "/Nodes/DeleteNode", { NodeID: nodeID, InstanceID: instanceID }, function (data) {
        if (!checkForErrorsGenxyz(data)) {
            
        }
        CloseMenus();
    });
});

//closes all open menus.
function CloseMenus() {
    $(".genxyz-menu:visible").each(function (index, value) {
        $(this).hide(100);
        if ($(this).data("icon")) {
            var targetIcon = $("#" + $(this).data("icon"));
            targetIcon.removeClass("activeIcon");
        }
    });
    $("#genxyz-rightClickMenu").hide();

    $("#genxyz-subMenu").html("Loading...");
}

//change size of nodes.
function setNodeSize(size){
    Genxyz.nodeSize = size;
    $("#nodeSize").val(size);
}

function setZoomValue(size) {
    Genxyz.zoom = size;
    $("#nodeZoom").val(size);
}



//debug menus.
$("#nodeSize").change(function() {
    setNodeSize($(this).val());
});

$("#nodeZoom").change(function () {
    setZoomValue($(this).val());
});

$("#removeNodeFromLayer").click(function (e) {
    $.post(subFolder + "/Nodes/RemoveFromLayer", { NodeID: Genxyz.selectedNode, LayerID: Genxyz.LayerUI.activeLayer }, function (data) {
        if (checkForErrorsGenxyz(data)) {
            
        }
        CloseMenus();
    });
});