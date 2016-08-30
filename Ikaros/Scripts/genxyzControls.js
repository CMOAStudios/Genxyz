//set some variables.
var lookSpeed = 0.05;

$("document").ready(function () {
    //mouse

    $(this).mousedown(function (e) {
        if (Genxyz.uiFocusedToggled) {
            Genxyz.uiFocusedToggled = false;
        } else {
            Genxyz.uiFocused = false;
        }
    });

    $("#GenxyzUI").mousedown(function (e) {
        Genxyz.uiFocused = true;
        Genxyz.uiFocusedToggled = true;
        e.preventDefault();
        e.stopPropagation();
        Genxyz.preventUpdate = true;
        Genxyz.mouseDownPos = new THREE.Vector2(e.clientX, e.clientY);

        switch (e.which) {
            case 1:
                Genxyz.mouseLeft = true;
                leftClick(e);
                break;
            case 2:
                Genxyz.mouseMiddle = true;
                break;
            case 3:
                Genxyz.mouseRight = true;
                rightDown(e);
                break;
        }
    });

    $("#GenxyzUI").dblclick(function (e) {
        var container = $("#genxyz-input-container");
        if (container.is(":visible")) {
            container.find("textarea").blur();
            container.hide();
        }
        var editMenu = $("#genxyz-detailsMenu");
        editMenu.fadeIn();
    });

    //when you let go of the mouse
    $("#GenxyzUI").mouseup(function (e) {
        Genxyz.mouseUpPos = new THREE.Vector2(e.clientX, e.clientY);
        e.preventDefault();
        e.stopPropagation();
        Genxyz.preventUpdate = false;
        switch (e.which) {
            case 1:
                Genxyz.mouseLeft = false;
                //if (Genxyz.selectedNode && Genxyz.nodes[findNodeIndex(Genxyz.selectedNode)].moved) {
                //push update. for now, by way of acting as if you ahd clicked the save button.
                for (var i = 0; i < Genxyz.selectedNodes.length; i++) {
                    var index = findNodeIndex(Genxyz.selectedNodes[i]);
                    if (index != -1 && Genxyz.nodes[index].moved) {
                        $("#genxyz-editNode-save").trigger("click");
                    }
                }
                //    //Genxyz.nodes[findNodeIndex(Genxyz.selectedNode)].pendingUpdate = true;
                //}
                break;
            case 2:
                Genxyz.mouseMiddle = false;
                break;
            case 3:
                rightUp(e);
                Genxyz.mouseRight = false;
                break;
        }
    });

    //handles mouse movement.
    $("#GenxyzUI canvas").mousemove(function (e) {
        if (!Genxyz.lockMouseMoveFunction) {
            Genxyz.lockMouseMoveFunction = true;
            Genxyz.lastMouseX = Genxyz.mouseX;
            Genxyz.lastMouseY = Genxyz.mouseY;
            Genxyz.mouseX = e.offsetX;
            Genxyz.mouseY = e.offsetY;
            Genxyz.mouseWorld.x = (e.offsetX / $("#GenxyzUI canvas").innerWidth() * 2) - 1;
            Genxyz.mouseWorld.y = -(e.offsetY / $("#GenxyzUI canvas").innerHeight() * 2) + 1;
            //Genxyz.Gfx.RayCaster.setFromCamera(Genxyz.Gfx.Camera, Genxyz.mouseWorld);
            //console.log("X: " + Genxyz.mouseWorld.x + " / Y: " + Genxyz.mouseWorld.y);
            Genxyz.mouseXAbs = Genxyz.cameraX + e.offsetX / Genxyz.getZoom();
            Genxyz.mouseYAbs = Genxyz.cameraY + e.offsetY / Genxyz.getZoom();
            //pan camera around.
            if (Genxyz.mouseRight || Genxyz.mouseLeft) {
                /*Genxyz.cameraX += ((Genxyz.lastMouseX - Genxyz.mouseX) / Genxyz.getZoom());
                Genxyz.cameraY += ((Genxyz.lastMouseY - Genxyz.mouseY) / Genxyz.getZoom());*/
                if (Genxyz.mouseRight) {
                    Genxyz.Gfx.Camera.translateZ(-(Genxyz.lastMouseY - Genxyz.mouseY) / 3);
                } else if (Genxyz.mouseLeft && Genxyz.selectedNodes.length == 0) {
                    Genxyz.Gfx.Camera.translateX((Genxyz.lastMouseX - Genxyz.mouseX) / 3);
                    Genxyz.Gfx.Camera.translateY(-(Genxyz.lastMouseY - Genxyz.mouseY) / 3);
                }
            } else if (Genxyz.mouseMiddle) {
                rotateCamera(e);
            }

            //this is to drag mouse around.
            if (Genxyz.selectedNodes.length > 0 && Genxyz.mouseLeft && !e.shiftKey) {
                for (var i = 0; i < Genxyz.selectedNodes.length; i++) {
                    //find the intersect as usual
                    var intersects = Genxyz.Gfx.RayCaster.intersectObject(Genxyz.Gfx.HelperPlane);
                    if (intersects.length > 0) {
                        var target = findNodeIndex(Genxyz.selectedNodes[i]);
                        if (target != -1) {
                            var nodeModel = Genxyz.Gfx.Scene.getObjectById(Genxyz.nodes[target].modelID);
                            nodeModel.position.copy(intersects[0].point.sub(Genxyz.Gfx.Offset));

                            //copy the model position.
                            updateLinkRenderByNode(Genxyz.selectedNodes[i]);
                            Genxyz.Gfx.HelperPlane.position.copy(nodeModel.position);
                            if (Genxyz.UI.Snap) {
                                var pos = nodeModel.position;
                                nodeModel.position.set(NearestMultiple(pos.x, Genxyz.UI.Grid.size), NearestMultiple(pos.y, Genxyz.UI.Grid.size), NearestMultiple(pos.z, Genxyz.UI.Grid.size));
                            }
                            Genxyz.nodes[target].xPos = nodeModel.position.x;
                            Genxyz.nodes[target].yPos = nodeModel.position.y;
                            Genxyz.nodes[target].zPos = nodeModel.position.z;
                            Genxyz.Gfx.HelperPlane.rotation.copy(Genxyz.Gfx.Camera.rotation);
                            //update the data.
                            updateNodeDetails(Genxyz.nodes[target].NodeID);
                            //mark it as moved.
                            Genxyz.nodes[target].moved = true;
                        }
                    }
                }
            }
            Genxyz.lockMouseMoveFunction = false;

            //update the position of the plane, if required.
            if (Genxyz.hoverNode != -1 && !Genxyz.mouseLeft && !e.ctrlKey && !e.shiftKey && !e.altKey) {
                var nodeIndex = findNodeIndex(Genxyz.hoverNode);
                if (nodeIndex != -1) {
                    //get the 3d object.
                    var nodeModel = Genxyz.Gfx.Scene.getObjectById(Genxyz.nodes[nodeIndex].modelID);

                    Genxyz.Gfx.HelperPlane.position.copy(nodeModel.position);
                    Genxyz.Gfx.HelperPlane.rotation.copy(Genxyz.Gfx.Camera.rotation);
                }
            }

            if (e.ctrlKey) {
                Genxyz.Gfx.HelperNode.visible = true;

                //move the helper plane, to -30.
                Genxyz.Gfx.HelperPlane.position.copy(Genxyz.Gfx.Camera.position);
                Genxyz.Gfx.HelperPlane.rotation.copy(Genxyz.Gfx.Camera.rotation);
                Genxyz.Gfx.HelperPlane.translateZ(-20);
                //Genxyz.Gfx.HelperPlane.lookAt(Genxyz.Gfx.Camera.position);

                var intersects = Genxyz.Gfx.RayCaster.intersectObject(Genxyz.Gfx.HelperPlane);
                if (intersects.length > 0) {
                    Genxyz.Gfx.HelperNode.position.copy(intersects[0].point);
                    //if snap is on, alter this to the nearest snap value - in this case, multiples of 2 right now by default.
                    if (Genxyz.UI.Snap) {
                        var pos = Genxyz.Gfx.HelperNode.position;
                        Genxyz.Gfx.HelperNode.position.set(NearestMultiple(pos.x, Genxyz.UI.Grid.size), NearestMultiple(pos.y, Genxyz.UI.Grid.size), NearestMultiple(pos.z, Genxyz.UI.Grid.size));
                    }
                }

            } else if (Genxyz.Gfx.HelperNode.visible == true) {
                Genxyz.Gfx.HelperNode.visible = false;
            }
        }
    });

    $(this).mousewheel(function (e) {
        e.preventDefault();
        //if mouseleft is held down AND there is a selected node.
        if (Genxyz.selectedNodes.length > 0 && Genxyz.mouseLeft) {
            for (var i = 0; i < Genxyz.selectedNodes.length; i++) {
                //get the model, rotate, and do some Z movement!
                var target = findNodeIndex(Genxyz.selectedNodes[i]);
                var nodeModel = Genxyz.Gfx.Scene.getObjectById(Genxyz.nodes[target].modelID);

                //move the helperplane.
                Genxyz.Gfx.HelperPlane.translateZ(-20);
                var intersects = Genxyz.Gfx.RayCaster.intersectObject(Genxyz.Gfx.HelperPlane);

                if (intersects.length > 0) {
                    Genxyz.Gfx.Offset.copy(intersects[0].point).sub(Genxyz.Gfx.HelperPlane.position);
                    nodeModel.position.copy(intersects[0].point.sub(Genxyz.Gfx.Offset));
                }

                Genxyz.nodes[target].xPos = nodeModel.position.x;
                Genxyz.nodes[target].yPos = nodeModel.position.y;
                Genxyz.nodes[target].zPos = nodeModel.position.z;
                updateLinkRenderByNode(Genxyz.selectedNodes[i]);
                Genxyz.Gfx.HelperPlane.position.copy(nodeModel.position);
                Genxyz.Gfx.HelperPlane.rotation.copy(Genxyz.Gfx.Camera.rotation);

            }
        } else {
            moveCamera(1, 0, 0, e.deltaY * -1);
        }
    });

    //keyboard stuff.
    $(this).keydown(function (e) {
        if (e.keyCode == 27){
            Genxyz.esc = true;
            var editMenu = $("#genxyz-detailsMenu").fadeOut();
        }

        //if ignore other inputs is checked, ignore stuff.
        if ($(".ignore-other-inputs").is(":focus") && ( e.keyCode == 9 || e.keyCode == 27)) {
            e.preventDefault();
            $(document.activeElement).blur();
        } else {
            if (Genxyz.uiFocused && $(document.activeElement).hasClass("ignore-other-inputs") == false && $(document.activeElement).is("input") == false) {
                var tarX = 0;
                var tarY = 0;
                var tarZ = 0;
                var rotX = 0;
                var rotY = 0;
                if (e.keyCode == 37 || e.keyCode == 65 || e.keyCode == 68 || e.keyCode == 39) {
                    if (!e.ctrlKey) {
                        tarX = (e.keyCode == 37 || e.keyCode == 65) ? -1 : (e.keyCode == 68 || e.keyCode == 39) ? 1 : 0;
                    } else if (e.ctrlKey) {
                        rotX = (e.keyCode == 37 || e.keyCode == 65) ? -1 : (e.keyCode == 68 || e.keyCode == 39) ? 1 : 0;
                    }
                }
                if (e.keyCode == 87 || e.keyCode == 38 || e.keyCode == 83 || e.keyCode == 40) {
                    if (!e.ctrlKey && !e.shiftKey) {
                        tarY = (e.keyCode == 87 || e.keyCode == 38) ? 1 : (e.keyCode == 83 || e.keyCode == 40) ? -1 : 0;
                    } else if (e.shiftKey) {
                        tarZ = (e.keyCode == 87 || e.keyCode == 38) ? -1 : (e.keyCode == 83 || e.keyCode == 40) ? 1 : 0;
                    } else if (e.ctrlKey) {
                        rotY = (e.keyCode == 87 || e.keyCode == 38) ? -1 : (e.keyCode == 83 || e.keyCode == 40) ? 1 : 0;
                    }
                }

                if ((rotX != 0 || rotY != 0) && Genxyz.Gfx.Camera.userData.moveTween == null && Genxyz.Gfx.Camera.userData.rotTween == null) {
                    var helperObject = new THREE.Object3D();
                    helperObject.position.copy(Genxyz.Gfx.Camera.position);
                    helperObject.rotation.copy(Genxyz.Gfx.Camera.rotation);
                    helperObject.translateZ(-20);
                    helperObject.rotateY(rotX * (Math.PI / 2));
                    helperObject.rotateX(rotY * (Math.PI / 2));

                    //force to nearest math.pi/2.
                    if (helperObject.rotation.x != Genxyz.Gfx.Camera.rotation.x) {
                        helperObject.rotation.x = NearestMultiple(helperObject.rotation.x, (Math.PI / 2));
                    }
                    if (helperObject.rotation.y != Genxyz.Gfx.Camera.rotation.y) {
                        helperObject.rotation.y = NearestMultiple(helperObject.rotation.y, (Math.PI / 2));
                    }
                    if (helperObject.rotation.z != Genxyz.Gfx.Camera.rotation.z) {
                        helperObject.rotation.z = NearestMultiple(helperObject.rotation.z, (Math.PI / 2));
                    }

                    Genxyz.Gfx.Camera.userData.rotLookAt = helperObject.position.clone();
                    helperObject.translateZ(20);

                    //Genxyz.Gfx.Camera.position.copy(helperObject.position);

                    var origin = {
                        x: Genxyz.Gfx.Camera.position.x, y: Genxyz.Gfx.Camera.position.y, z: Genxyz.Gfx.Camera.position.z,
                    };
                    var target = {
                        x: helperObject.position.x, y: helperObject.position.y, z: helperObject.position.z,
                    };

                    Genxyz.Gfx.Camera.userData.rotTween = new TWEEN.Tween(origin).to(target, 1000);
                    Genxyz.Gfx.Camera.userData.rotTween.easing(TWEEN.Easing.Cubic.Out);
                    Genxyz.Gfx.Camera.userData.rotTween.onUpdate(function () {
                        Genxyz.Gfx.Camera.position.x = this.x;
                        Genxyz.Gfx.Camera.position.y = this.y;
                        Genxyz.Gfx.Camera.position.z = this.z;
                        Genxyz.Gfx.Camera.lookAt(Genxyz.Gfx.Camera.userData.rotLookAt);
                    }).onComplete(function () {
                        Genxyz.Gfx.Camera.userData.rotTween = null;
                    });

                    Genxyz.Gfx.Camera.userData.rotTween.start();
                }

                if (Genxyz.Gfx.Camera.userData.rotTween == null && (tarX != 0 || tarY != 0 || tarZ != 0)) {
                    moveCamera(1, tarX, tarY, tarZ);
                }
            }
        }
    });

    $(this).keyup(function (e) {
        //if ignore other inputs is checked, ignore stuff.
        if (Genxyz.uiFocused && $(document.activeElement).hasClass("ignore-other-inputs") == false) {
            
            if (e.keyCode == 38) {
                e.preventDefault();
            }
            if (e.keyCode == 40) {
                e.preventDefault();
            }

            if (e.keyCode == 71) {
                Genxyz.UI.toggleGrid();
            }

            if (e.keyCode == 76) {
                /*
                $("#genxyz-layerMenu").finish().toggle(100).css({
                    top: Genxyz.mouseY + "px",
                    left: Genxyz.mouseX + "px"
                });
                Genxyz.Layers.populate();*/
                Genxyz.UI.toggleLayerMenu();
            }

            if (e.keyCode == 75) {
                Genxyz.UI.toggleSnap();
            }

            if (e.keyCode == 107) {
                Genxyz.UI.Grid.xSize = Math.min(Genxyz.UI.Grid.xSize + 5, 250);
                Genxyz.UI.Grid.ySize = Genxyz.UI.Grid.xSize;
            }
            if (e.keyCode == 109) {
                Genxyz.UI.Grid.xSize = Math.max(Genxyz.UI.Grid.xSize - 5, 10);
                Genxyz.UI.Grid.ySize = Genxyz.UI.Grid.xSize;
            }
            if (e.keyCode == 90) {
                Genxyz.UI.toggleDebug();
            }
            if (e.keyCode == 72) {
                Genxyz.UI.toggleHelp();
            }
            if (e.keyCode == 88) {
                $("#genxyz-instanceMenu").toggle(100);
            }
            if (e.keyCode == 192) {
                Genxyz.UI.CreateOnClick = !Genxyz.UI.CreateOnClick;
            }

            if (e.keyCode == 69) {
                AddGenxyzError("Error found!");
            }

            //space bar!
            if (e.keyCode == 32) {
                //as always, check to see if there's anything happenign right now with rotation or move tweens.

                if (!e.shiftKey) {
                    //move to the target position.
                    var target = new THREE.Vector3();
                    if (Genxyz.selectedNodes.length == 0) {
                        target.set(0, 0, 0);
                    } else {
                        //get the most recently selected node, focus on that.
                        var index = findNodeIndex(Genxyz.selectedNodes[Genxyz.selectedNodes.length - 1]);

                        //if it can't be found.
                        if (index == -1) {
                            target.set(0, 0, 0);
                        } else {
                            target.copy(Genxyz.Gfx.Scene.getObjectById(Genxyz.nodes[index].modelID).position);
                        }
                    }
                    //set up a tween.
                    var helperObject = new THREE.Object3D();
                    helperObject.position.copy(target)
                    helperObject.rotation.copy(Genxyz.Gfx.Camera.rotation);
                    helperObject.translateZ(20);
                    var position = Genxyz.Gfx.Camera.position;
                    var target = helperObject.position;

                    Genxyz.Gfx.Camera.userData.tweenTarget = target;
                    Genxyz.Gfx.Camera.userData.moveTween = new TWEEN.Tween(position).to(target, 1000);
                    Genxyz.Gfx.Camera.userData.moveTween.easing(TWEEN.Easing.Cubic.Out);

                    Genxyz.Gfx.Camera.userData.moveTween.onUpdate(function () {
                        Genxyz.Gfx.Camera.position.x = position.x;
                        Genxyz.Gfx.Camera.position.y = position.y;
                        Genxyz.Gfx.Camera.position.z = position.z;
                    });
                    Genxyz.Gfx.Camera.userData.moveTween.onComplete(function () {
                        Genxyz.Gfx.Camera.userData.moveTween = null;
                    });
                    Genxyz.Gfx.Camera.userData.moveTween.start();
                } else {

                    //reset rotation.
                    Genxyz.Gfx.Camera.rotation.set(0, 0, 0);
                }
            }
        }
        if (e.keyCode == 27) {
            $(document.activeElement).blur();
        }
    });
});

//scan for target of left click.
function leftClick(e) {
    //close any menus.
    if (!$(e.target).parents(".genxyz-menu").length > 0) {
        // Hide it
        CloseMenus();
    }

    //if holding down shift, do not deselect over a missed click.
    if (!e.shiftKey && !e.ctrlKey) {
        clearSelectedNodes();
    }
    var targetClicked = findHover();
    if (targetClicked != -1) {
        selectNode(targetClicked);
    }
    //If create on click is enabled, use it here.
    if (Genxyz.UI.CreateOnClick || e.ctrlKey || (e.shiftKey && targetClicked == -1)) {
        Genxyz.mouseLeft = false;
        createNode(e);
    } else {
        //hide if needed.
        var container = $("#genxyz-input-container");
        if (container.is(":visible")) {
            container.find("textarea").blur();
            container.hide();
        }

    }
}

//right click - mostly context menus.
function rightDown(e) {
    //find target. //don't unselect though.
    $(".genxyz-menu").hide(100);
}

function rightUp(e) {
    //none of this happens if down pos isn't the same as up pos
    if (Genxyz.mouseDownPos.distanceTo(Genxyz.mouseUpPos) > 3) {
        return;
    }
    //at this point, we will find the node id by hover.
    Genxyz.targetedNode = Genxyz.hoverNode;
    var target = findNodeIndex(Genxyz.hoverNode); //-1 = not found.
    if ((e.ctrlKey || e.shiftKey || e.altKey) && Genxyz.selectedNodes.length > 0 && target != -1) {
        //create a link, if there is a selected target.
        for (var i = 0; i < Genxyz.selectedNodes.length; i++) {
            var index = findNodeIndex(Genxyz.selectedNodes[i]);
            if (index != -1) {
                //create a link!
                var link = {};
                link.OriginID = Genxyz.nodes[index].NodeID;
                link.TargetID = Genxyz.nodes[target].NodeID;

                link.active = true;
                link.Type = (e.ctrlKey ? "Parent" : "Sibling");
                $.post(subFolder + "/Nodes/CreateLink", { link }, function (data) {
                    if (!checkForErrorsGenxyz(data)) {

                    } else {

                    }
                }).fail(function (data) {
                    AddGenxyzError("Error!");
                });
            }
        }
        updateNodeDetails($("#genxyz-editMenu").find("#NodeID").val());
        //open menus at this point.
    } else {
        if (target != -1) {
            selectNode(Genxyz.hoverNode);
        }
        if (Genxyz.selectedNodes.length == 0 && target == -1) {
            //no target at all.
            showRightClickMenu(e);
            $("#right-click-menu-noTarget").show();
        } else if (Genxyz.selectedNodes.length > 0 && target == -1) {
            //targeting no node.
            showRightClickMenu(e);
            $("#right-click-menu-selected").show();
        } else if (Genxyz.selectedNodes.length > 0 && target != -1) {
            //targeting a node, and a node is selected.
            showRightClickMenu(e);
            $("#right-click-menu-selected").show();
            $("#right-click-menu-selected-target").show();
        }
    }
}

//Create node.
function createNode(e) {


    //copy the position from the helper object into a new item.
    var myObject = new THREE.Mesh(Genxyz.Geometries.Node, Genxyz.Materials.NodeBasic);
    myObject.position.copy(Genxyz.Gfx.HelperNode.position);

    //ignore this for now.
    /*if (intersects.length == 0) {
        setTimeout(function () {
            setTimeout(createNode(e));
        }, 100);
        return;
    }*/
    var container = $("#genxyz-input-container");
    if (container.is(":visible")) {
        container.find("textarea").blur();
        container.hide();
    }
    container.show(100, function () {
        
        console.log(myObject.position.x + " " + myObject.position.y + " " + myObject.position.z);
        container.find("#xPos").val(myObject.position.x);
        container.find("#yPos").val(myObject.position.y);
        container.find("#zPos").val(myObject.position.z);
        container.find("#InstanceID").val(Genxyz.instance);
        container.find("#ParentNodeID").val(Genxyz.selectedNode);
        container.find("#LayerID").val(Genxyz.LayerUI.activeLayer);
        container.find("#SiblingNodeID").val(null);
        container.find("#Comments").val("");
        container.find("textarea").focus();
    }).
    css({
        top: e.pageY + "px",
        left: e.pageX + "px"
    });
}

//Find Snap
function findSnap(X, Y) {
    var pos = {};
    var xRemainder = X % Genxyz.UI.Grid.xSize;
    var yRemainder = Y % Genxyz.UI.Grid.ySize;
    if (Math.abs(xRemainder) > Genxyz.UI.Grid.xSize / 2) {
        if (xRemainder < 0){
            pos.x = X - (Genxyz.UI.Grid.xSize + xRemainder);
        } else {
            pos.x = X + (Genxyz.UI.Grid.xSize - xRemainder);
        }
    } else {
        pos.x = X - xRemainder;
    }

    if (Math.abs(yRemainder) > Genxyz.UI.Grid.ySize / 2) {
        if (yRemainder < 0){
            pos.y = Y - (Genxyz.UI.Grid.ySize + yRemainder);
        } else {
            pos.y = Y + (Genxyz.UI.Grid.ySize - yRemainder);
        }
    } else {
        pos.y = Y - yRemainder;
    }

    return pos;
}

function findClickedNode(e) {
    //find if it intersects.
    if (Genxyz.Gfx.Intersected) {
        if (e.shiftKey) {
            if (Genxyz.multiSelectedNodes.length == 0) {
                Genxyz.multiSelectedNodes.push(Genxyz.selectedNode);
            }
        }
        if (Genxyz.Gfx.Intersected == Genxyz.Gfx.selectedNode) {

        } else {
            Genxyz.selectedNode = Genxyz.Gfx.Intersected.userData.nodeID;
        }
    } else {
        return -1;
    }
}

$("#layersIcon").click(function () {
    Genxyz.UI.toggleLayerMenu();
});

$("#filterLayersIcon").click(function () {
    Genxyz.UI.toggleFilterLayersMenu();
});

$("#gridIcon").click(function () {
    Genxyz.UI.toggleGrid();
});

$("#snapIcon").click(function () {
    Genxyz.UI.toggleSnap();
});

$("#debugIcon").click(function () {
    Genxyz.UI.toggleDebug();
});

$("#helpIcon").click(function () {
    Genxyz.UI.toggleHelp();
});

$("body").contextmenu(function(e){
    return false;
});

function moveCamera(multiplier, x, y, z) {
    multiplier = typeof multiplier == "undefined" ? 1 : multiplier;
    x = typeof x == "undefined" ? 0 : x;
    y = typeof y == "undefined" ? 0 : y;
    z = typeof z == "undefined" ? 0 : z;
    if (Genxyz.Gfx.Camera.userData.rotTween != null) {
        return;
    }
    //create helper object and all that fun jazz.
    var helperObject = new THREE.Object3D();
    //check if the tween already exists.
    if (Genxyz.Gfx.Camera.userData.moveTween != null) {
        helperObject.position.set(Genxyz.Gfx.Camera.userData.tweenTarget.x, Genxyz.Gfx.Camera.userData.tweenTarget.y, Genxyz.Gfx.Camera.userData.tweenTarget.z);
        Genxyz.Gfx.Camera.userData.moveTween.stop();
    } else {
        helperObject.position.copy(Genxyz.Gfx.Camera.position);
    }
    helperObject.rotation.copy(Genxyz.Gfx.Camera.rotation);
    helperObject.translateX((5 * multiplier) * x);
    helperObject.translateY((5 * multiplier) * y);
    helperObject.translateZ((5 * multiplier) * z);
    var position = { x: Genxyz.Gfx.Camera.position.x, y: Genxyz.Gfx.Camera.position.y, z: Genxyz.Gfx.Camera.position.z };
    var target = { x: helperObject.position.x, y: helperObject.position.y, z: helperObject.position.z };
    if (position.x != target.x) {
        target.x = NearestMultiple(target.x, 5);
    }
    if (position.y != target.y) {
        target.y = NearestMultiple(target.y, 5);
    }
    if (position.z != target.z) {
        target.z = NearestMultiple(target.z, 5);
    }
    Genxyz.Gfx.Camera.userData.tweenTarget = target;
    Genxyz.Gfx.Camera.userData.moveTween = new TWEEN.Tween(position).to(target, 1000);
    Genxyz.Gfx.Camera.userData.moveTween.easing(TWEEN.Easing.Cubic.Out);

    Genxyz.Gfx.Camera.userData.moveTween.onUpdate(function () {
        Genxyz.Gfx.Camera.position.x = position.x;
        Genxyz.Gfx.Camera.position.y = position.y;
        Genxyz.Gfx.Camera.position.z = position.z;
    });
    Genxyz.Gfx.Camera.userData.moveTween.onComplete(function () {
        Genxyz.Gfx.Camera.userData.moveTween = null;
    });
    Genxyz.Gfx.Camera.userData.moveTween.start();
}

function rotateCamera(e) {
    //rotate.
    Genxyz.Gfx.Camera.rotateX(THREE.Math.degToRad(-(Genxyz.lastMouseY - Genxyz.mouseY)*Genxyz.RotateMultiplier));
    Genxyz.Gfx.Camera.rotateY(THREE.Math.degToRad(-(Genxyz.lastMouseX - Genxyz.mouseX) * Genxyz.RotateMultiplier));
}

function updateSelectedNodes() {
    //this runs through all selected nodes and updates them accordingly.
    
}

//adds a node to the selection and update the material.
function selectNode(nodeID) {
    var nodeIndex = findNodeIndex(nodeID);
    if (nodeIndex == -1) {
        return;
    }

    //now find the model and remove the selected material.
    var node = Genxyz.Gfx.Scene.getObjectById(Genxyz.nodes[nodeIndex].modelID).material = Genxyz.Materials.NodeSelected;
    updateNodeDetails(nodeID);

    //now find the offset.
    var intersects = Genxyz.Gfx.RayCaster.intersectObject(Genxyz.Gfx.HelperPlane);
    if (intersects.length > 0) {
        Genxyz.Gfx.Offset.copy(intersects[0].point).sub(Genxyz.Gfx.HelperPlane.position);
    }

    //only push if not already in the list.
    if (Genxyz.selectedNodes.indexOf(nodeID)) {
        Genxyz.selectedNodes.push(nodeID);
    }
}

function clearSelectedNodes() {
    //clears all selected nodes.
    var i = Genxyz.selectedNodes.length;
    while (i > 0) {
        i--;
        deselectNode(Genxyz.selectedNodes[i]);
    }
}

function deselectNode(nodeID) {
    //unselects one specific node.
    //find the index of the nodeID.
    var index = Genxyz.selectedNodes.indexOf(nodeID);

    //fail if nothing found.
    if (index == -1) {
        return;
    }

    var nodeIndex = findNodeIndex(nodeID);
    if (nodeIndex == -1){
        return;
    }

    //now find the model and remove the selected material.
    var model = Genxyz.Gfx.Scene.getObjectById(Genxyz.nodes[nodeIndex].modelID);
    if (model.userData.inLayer){
        model.material = Genxyz.Materials.NodeBasic;
    } else {
        model.material = Genxyz.Materials.NodeBasicOffLayer;
    }
    Genxyz.selectedNodes.splice(index, 1);
}

function findHover() {
    var intersects = Genxyz.Gfx.RayCaster.intersectObjects(Genxyz.Gfx.Scene.children);
    var nodeFound = -1;
    if (intersects.length > 0) {
        for (var i = 0; i < intersects.length; i++) {
            if (intersects[i].object.userData.type == "node") {
                var node = intersects[i].object;
                nodeFound = node.userData.nodeID;
                break;
            }
        }
    }
    return nodeFound;
}

//find the node that is being hovered.
function updateHover() {
    var nodeFound = findHover();
    //first, find if the node even exists anymore.
    var index = findNodeIndex(Genxyz.hoverNode);
    
    if (nodeFound != Genxyz.hoverNode) {
        //remove current hover, if there is one.
        var node;
        if (Genxyz.hoverNode != -1 && findNodeIndex(Genxyz.hoverNode) != -1) {
            if (Genxyz.selectedNodes.indexOf(Genxyz.hoverNode) != -1) {
                Genxyz.Gfx.Scene.getObjectById(findRenderNodeByNodeID(Genxyz.hoverNode)).material = Genxyz.Materials.NodeSelected;
            } else {
                var model = Genxyz.Gfx.Scene.getObjectById(findRenderNodeByNodeID(Genxyz.hoverNode));
                if (model.userData.inLayer) {
                    model.material = Genxyz.Materials.NodeBasic;
                } else {
                    model.material = Genxyz.Materials.NodeBasicOffLayer;
                }
            }
        }
        Genxyz.hoverNode = nodeFound;
        if (Genxyz.hoverNode != -1 && findNodeIndex(Genxyz.hoverNode) != -1) {
            if (Genxyz.selectedNodes.indexOf(Genxyz.hoverNode) != -1) {
                var model = Genxyz.Gfx.Scene.getObjectById(findRenderNodeByNodeID(Genxyz.hoverNode));
                model.material = Genxyz.Materials.NodeSelectedHover;
            } else {
                var model = Genxyz.Gfx.Scene.getObjectById(findRenderNodeByNodeID(Genxyz.hoverNode));
                if (model.userData.inLayer) {
                    model.material = Genxyz.Materials.NodeBasicHover;
                } else {
                    model.material = Genxyz.Materials.NodeBasicHoverOffLayer;
                }
            }
        }
    }
}
