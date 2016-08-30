//called every so often.
function redraw() {
    //draw all nodes first.
    if (updateNodeRenders()) {
        updateLinkRenders();
        updateDisplayData();
    }

    //update light pos.
    Genxyz.Gfx.PointLight.position.copy(Genxyz.Gfx.Camera.position);
    Genxyz.Gfx.PointLight.rotation.copy(Genxyz.Gfx.Camera.rotation);
    Genxyz.Gfx.PointLight.translateX(5);

    //update grid pos and rotation.
    //"shoot out" a helper object.
    var helperObject = new THREE.Object3D;
    helperObject.rotation.copy(Genxyz.Gfx.Camera.rotation);
    helperObject.position.copy(Genxyz.Gfx.Camera.position);
    helperObject.translateZ(-20);

    helperObject.position.x = NearestMultiple(helperObject.position.x, 1);
    helperObject.position.y = NearestMultiple(helperObject.position.y, 1);
    helperObject.position.z = NearestMultiple(helperObject.position.z, 1);
    Genxyz.Gfx.GridHelper.position.copy(helperObject.position);
    
}

var render = function () {
    requestAnimationFrame(render);
    redraw();
    TWEEN.update();

    //find intersects.
    Genxyz.Gfx.RayCaster.setFromCamera(Genxyz.mouseWorld, Genxyz.Gfx.Camera);
    updateHover();
    updateDebug();
    updateInLayer();


    Genxyz.Gfx.Renderer.render(Genxyz.Gfx.Scene, Genxyz.Gfx.Camera);
};

function updateNodeRenders() {
    var drawCount = 0;
    var drawLimit = 19;
    for (var i = 0; i < Genxyz.nodes.length; i++) {
        if (typeof Genxyz.nodes[i] != "undefined" && typeof Genxyz.nodes[i].modelID == "undefined") {
            //create.
            
            var sphere = new THREE.Mesh(Genxyz.Geometries.Node, Genxyz.Materials.NodeBasic);
            sphere.position.x = Genxyz.nodes[i].xPos;
            sphere.position.y = Genxyz.nodes[i].yPos;
            sphere.position.z = Genxyz.nodes[i].zPos;
            var children = Genxyz.countChildren(Genxyz.nodes[i].NodeID);
            var scaleTarget = 1;
            if (children > 0) {
                var scaleDivisor = 10;
                var scaleValue = 1;
                var scaleMultiplier = 2;
                var scaleStep = 10;
                while (children > 0) {
                    scaleTarget += Math.min(children, scaleStep) / (scaleDivisor * scaleValue);
                    scaleValue = scaleValue * scaleMultiplier;
                    children -= scaleStep;
                }
            }
            sphere.scale = scaleTarget;
            sphere.userData = { type: "node", nodeID: Genxyz.nodes[i].NodeID, inLayer: null };
            Genxyz.Gfx.Scene.add(sphere);
            Genxyz.nodes[i].modelID = sphere.id;

            //console.log("sphere x/y/z " + sphere.position.x + " " + sphere.position.y + " " + sphere.position.z); 
            drawCount++;
            if (drawCount > drawLimit) {
                break;
            }
        }
    }

    if (drawCount == 0) {
        return true;
    }
    return false;
}

function updateInLayer() {
    //this works in a similar fashion to the others, but upon changing path, all are toggled to not changed.
    var drawCount = 0;
    var drawLimit = 19;
    for (var i = 0; i < Genxyz.nodes.length; i++) {
        var node = Genxyz.nodes[i];
        if (typeof node.modelID != "undefined") {
            var modelID = node.modelID;
            var model = Genxyz.Gfx.Scene.getObjectById(modelID);
            if (model.userData.inLayer == null) {
                model.userData.inLayer = false;
                if (FindInLayer(node.NodeID, Genxyz.LayerUI.activeLayer)) {
                    model.userData.inLayer = true;
                } else {
                    for (var x = 0; x < Genxyz.LayerUI.selectedLayers.length; x++) {
                        if (FindInLayer(node.NodeID, Genxyz.LayerUI.selectedLayers[x])) {
                            model.userData.inLayer = true;
                        }
                    }
                }
                if (model.userData.inLayer) {
                    model.material = Genxyz.Materials.NodeBasic;
                } else {
                    model.material = Genxyz.Materials.NodeBasicOffLayer;
                }
                drawCount++;
            }
        }
        if (drawCount > drawLimit) {
            break;
        }
    }
    for (var i = 0; i < Genxyz.links.length; i++) {
        var link = Genxyz.links[i];
        if (typeof link.modelID != "undefined") {
            var modelID = link.modelID;
            var model = Genxyz.Gfx.Scene.getObjectById(modelID);
            if (model.userData.inLayer == null) {
                model.userData.inLayer = false;
                if (FindInLayer(link.OriginID, Genxyz.LayerUI.activeLayer) && FindInLayer(link.TargetID, Genxyz.LayerUI.activeLayer)) {
                    model.userData.inLayer = true;
                } else {
                    for (var x = 0; x < Genxyz.LayerUI.selectedLayers.length; x++) {
                        if (FindInLayer(link.OriginID, Genxyz.LayerUI.selectedLayers[x]) && FindInLayer(link.TargetID, Genxyz.LayerUI.selectedLayers[x])) {
                            model.userData.inLayer = true;
                        }
                    }
                }
                if (model.userData.inLayer) {
                    if (link.Type == "Parent") {
                        model.material = Genxyz.Materials.LineParentBasic;
                    } else {
                        model.material = Genxyz.Materials.LineSiblingBasic;
                    }
                } else {
                    if (link.Type == "Parent") {
                        model.material = Genxyz.Materials.LineParentBasicOffLayer;
                    } else {
                        model.material = Genxyz.Materials.LineSiblingBasicOffLayer;
                    }
                }
                drawCount++;
            }
        }
        if (drawCount > drawLimit) {
            break;
        }
    }
}

function updateLinkRenders() {
    var drawCount = 0;
    var drawLimit = 19;
    for (var i = 0; i < Genxyz.links.length; i++) {
        if (typeof Genxyz.links[i].modelID == "undefined" || Genxyz.links[i].modelID == null){
            //find position of origin and target.
            var origIndex = findNodeIndex(Genxyz.links[i].OriginID);
            var tarIndex = findNodeIndex(Genxyz.links[i].TargetID);
            if (origIndex == -1 || tarIndex == -1) {
                continue;
            }
            var origin = Genxyz.nodes[origIndex];
            var target = Genxyz.nodes[tarIndex];

            var origPos = Genxyz.Gfx.Scene.getObjectById(origin.modelID);
            var tarPos = Genxyz.Gfx.Scene.getObjectById(target.modelID);

            var distance = origPos.position.distanceTo(tarPos.position);
            /*
            var geom = new THREE.Geometry();

            geom.vertices.push(origPos.position);
            geom.vertices.push(tarPos.position);*/
            var pointX = origPos.position;
            var pointY = tarPos.position;

            /*var geom = new function (pointX, pointY) {
                // edge from X to Y
                var direction = new THREE.Vector3().subVectors(pointY, pointX);
                var arrow = new THREE.ArrowHelper(direction, pointX);

                // cylinder: radiusAtTop, radiusAtBottom, 
                //     height, radiusSegments, heightSegments
                var edgeGeometry = new THREE.CylinderGeometry(.1, .1, direction.length());

                var edge = new THREE.Mesh(edgeGeometry,
                    new THREE.MeshBasicMaterial({ color: 0x0000ff }));
                edge.rotation = arrow.rotation.clone();
                edge.position = new THREE.Vector3().addVectors(pointX, direction.multiplyScalar(0.5));
                return edge;
            }*/

            var line;
            if (Genxyz.links[i].Type == "Parent") {
                var geom = new THREE.CylinderGeometry(0.1, 0.1, distance);
                line = new THREE.Mesh(Genxyz.Geometries.ParentLink, Genxyz.Materials.LineParentBasic);
                //line = new THREE.Line(geom, Genxyz.Materials.LineParentBasic);
            } else {
                
                line = new THREE.Mesh(Genxyz.Geometries.SiblingLink, Genxyz.Materials.LineSiblingBasic);
                //line = new THREE.Line(geom, Genxyz.Materials.LineSiblingBasic);
            }

            line.userData = { type: "link", inLayer: null };
            line.scale.set(1, 1, distance);
            var posX = pointX;
            var posY = pointY;
            line.position.copy(posX);
            line.lookAt(posY);
            line.translateZ(distance / 2);
            Genxyz.Gfx.Scene.add(line);
            Genxyz.links[i].modelID = line.id;
            drawCount++;
            if (drawCount > drawLimit) {
                break;
            }
        }
    }
}

function updateDisplayData() {
    //clear out all the current divs showing.
    $(".genxyz-data-overlay").remove();
    //search for all existing nodes.

    //get list of all items being rendererd.
    var frustum = new THREE.Frustum();
    var projScreenMatrix = new THREE.Matrix4();
    projScreenMatrix.multiplyMatrices(Genxyz.Gfx.Camera.projectionMatrix, Genxyz.Gfx.Camera.matrixWorldInverse);

    frustum.setFromMatrix(new THREE.Matrix4().multiplyMatrices(Genxyz.Gfx.Camera.projectionMatrix, Genxyz.Gfx.Camera.matrixWorldInverse));


    //get all the nodes that have a model attached. should only be called if there were no new nodes created.
    for (var i = 0; i < Genxyz.nodes.length; i++) {
        //get the current position of the model. there should always be a model as per previous function.
        var node = Genxyz.nodes[i];
        var model = Genxyz.Gfx.Scene.getObjectById(node.modelID);
        if (typeof model == "undefined") {
            continue;
        }

        //find if it's being rendered.
        if (!frustum.containsPoint(model.position) || model.userData.inLayer != true) {
            continue;
        }

        //clone the object.
        var modelPos = model.clone();
        modelPos.rotation.copy(Genxyz.Gfx.Camera.rotation);

        var renderer = Genxyz.Gfx.Renderer.domElement;
        //determine distance.
        var distance = model.position.distanceTo(Genxyz.Gfx.Camera.position);

        //calculate scale.
        var scale = 1;
        if (distance > 30) {
            scale -= Math.min((distance-30) / 100, 0.7);
        }

        //we want to draw the text with an offset, based on the scale.
        modelPos.translateX(.4);
        modelPos.translateY(-.4);
        //determine screen position.
        var drawPos = modelPos.position.project(Genxyz.Gfx.Camera);
        drawPos.x = Math.round((drawPos.x + 1 ) * renderer.width / 2);
        drawPos.y = Math.round((-drawPos.y + 1) * renderer.height / 2);
        if (drawPos.x > -10 && drawPos.x < renderer.width + 10 && drawPos.y > -10 && drawPos.y < renderer.height + 10) {
            if (distance < 150) {
                //add div.
                html = "<div id='node" + node.NodeID + "' class='genxyz-data-overlay'>"
                if (Genxyz.selectedNodes.indexOf(node.NodeID) != -1) {
                    html += "<div class='title' data-selected='true'>" + node.Name + "</div>";
                    if (node.Comments != "" && node.Comments != null) {
                        html += "<div class='description'>" + node.Comments + "</div>";
                    }
                } else {
                    html += "<div class='title'>" + node.Name + "</div>";
                }
                html += "</div>";
                $("#GenxyzUI").append(html);

                $("#node" + node.NodeID).css({ "top": drawPos.y, "left": drawPos.x, "transform-origin": "top left", "transform": "scale(" + scale + "," + scale + ")", "display":"block" });
            }
        }
    }
}

//update individual.
function updateLinkRenderByNode(NodeID) {
    //find the link/s affected.
    for (var i = 0; i < Genxyz.links.length; i++) {
        if (Genxyz.links[i].OriginID == NodeID || Genxyz.links[i].TargetID == NodeID) {
            //drop the model, if there is one.
            var model = Genxyz.Gfx.Scene.getObjectById(Genxyz.links[i].modelID);
            Genxyz.Gfx.Scene.remove(model);
            Genxyz.links[i].modelID = null;
        }
    }
}

//needs to be redone for 3D
function drawGrid() {   
}

function drawMessages() {
    if (Genxyz.UI.Errors.length > 0) {
        ctx.font = "12px Arial";
        var y = 50;
        for (var i = 0; i < Genxyz.UI.Errors.length; i++) {
            Genxyz.UI.Errors[i].ttl--;
            if (Genxyz.UI.Errors[i].ttl < 1) {
                Genxyz.UI.Errors.splice(i, 1);
                i--;
            } else {
                ctx.fillStyle = "rgba(255,0,0," + Math.min(Genxyz.UI.Errors[i].ttl / 100, 1) + ")";
                var width = ctx.measureText(Genxyz.UI.Errors[i].message).width;
                var textX = canvas.width / 2 - width;
                y = y + 14;
                ctx.fillText(Genxyz.UI.Errors[i].message, textX, y);
            }
        }
    }
}

function clearPathRender() {
    //mark them all as unrendered for opacity purposes.
    for (var x = 0; x < Genxyz.nodes.length; x++) {
        if (typeof Genxyz.nodes[x].modelID != "undefined") {
            var model = Genxyz.Gfx.Scene.getObjectById(Genxyz.nodes[x].modelID);
            model.userData.inLayer = null;
        }
    }
    for (var x = 0; x < Genxyz.links.length; x++) {
        if (typeof Genxyz.links[x].modelID != "undefined") {
            var model = Genxyz.Gfx.Scene.getObjectById(Genxyz.links[x].modelID);
            model.userData.inLayer = null;
        }
    }
}