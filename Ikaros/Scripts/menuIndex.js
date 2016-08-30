$(document).ready(function () {
    $("#CreateInstance").click(function () {
        //for now just create a new instance.
    });

    $("form").submit(function () {
        return false;
    });
});

$(".replyInvite").click(function (e) {
    $.post(subFolder + "/Instances/ReplyInvite", { InviteID: $(e.target).attr("data-value"), Accept:$(e.target).attr("data-accept") }, function (data) {
        location.reload();
    });
});

$(".sendInvite").click(function (e) {
    var errorTarget = $(this).next(".errorList");
    $.post(subFolder + "/Instances/SendInvite", { InstanceID: $(this).attr("data-instanceID"), Recipient: $(this).prev("input").val() }, function (data) {
        if (!checkForErrors(data, errorTarget)) {
        }
    });
});

$(".button-delete-instance").click(function (e) {
    $("#deleteInstanceID").val($(e.currentTarget).attr("data-instance"));
    $("#deleteInstanceName").html($(e.currentTarget).attr("data-name"));
});

//click on the members icon.
$(".showMembers").click(function (e) {
    //find all member-rows with the same data-instance.
    var instanceID = $(e.currentTarget).attr("data-instance");
    var targetRow = $('.memberRow[data-instance="'+ instanceID+ '"]');
    targetRow.fadeToggle();
});

//show the config fields.
$(".showConfig").click(function (e) {
    var instanceID = $(e.currentTarget).attr("data-instance");
    var target = $('.nameField[data-instance="' + instanceID + '"]');
    var targetRow = $('.configRow[data-instance="' + instanceID + '"]');
    target.toggle();
    targetRow.fadeToggle();
});

//when user changes the info in the name field, update the hidden field.
$(".nameInput").blur(function (e) {
    var instanceID = $(e.currentTarget).attr("data-instance");
    $('.itemName[data-instance="' + instanceID + '"]').val($(e.currentTarget).val());

});

//save changes done in config.
$(".saveConfig").click(function (e) {
    var config = $(e.currentTarget).closest(".configRow");
    //find the name and update it.
    var instanceID = $(e.currentTarget).attr("data-instance");
    var target = $('.nameField[data-instance="' + instanceID + '"]');
    var targetRow = $('.configRow[data-instance="' + instanceID + '"]');
    target.toggle();
    targetRow.fadeToggle();
    $(".instanceDetails[data-instance='" + instanceID + "']").find(".instanceLink").text(config.find("#item_Name").val());
    submitForm(e);
    $('.instanceLink[data-instance="' + instanceID + '"]').text($('.itemName[data-instance="' + instanceID + '"]').val());
});