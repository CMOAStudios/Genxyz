using System;
using System.ComponentModel.DataAnnotations;

namespace Genxyz.Models
{
    public class Invite
    {
        public int InviteID { get; set; }

        public bool Active { get; set; }

        public bool? Accepted { get; set; }

        [Required]
        public int InstanceID { get; set; }

        public string Sender { get; set; }
        
        [Required]
        public string Recipient { get; set; }

        [Display(Name = "Sent on")]
        public DateTime DateSent { get; set; }

        [Display(Name = "Replied")]
        public DateTime? ReplySent { get; set; }

        public Invite()
        {

        }

        public Invite(CreateInvite i)
        {
            Active = true;
            Accepted = null;

            InstanceID = i.InstanceID;
            DateSent = DateTime.UtcNow;

            Sender = Generic.GetUserName();
            Recipient = i.Recipient;
        }

        public void Reply(bool accept)
        {
            Accepted = accept;
            ReplySent = DateTime.UtcNow;
        }

    }

    public class CreateInvite
    {
        [Required]
        public int InstanceID { get; set; }

        [Required]
        public string Recipient { get; set; }
    }

    public class InboundInvites
    {
        public int InviteID { get; set; }

        [Display(Name="Instance Name")]
        public string InstanceName { get; set; }

        public string Sender { get; set; }
        
        [Display(Name ="Sent on")]
        public DateTime DateSent { get; set; }

        public InboundInvites(Invite i)
        {
            InviteID =i.InviteID;

            ApplicationDbContext db = new ApplicationDbContext();
            InstanceName = db.Instances.Find(i.InstanceID).Name;

            Sender = Generic.GetUserDisplayName("",i.Sender);
            DateSent = i.DateSent;
        }
    }

    public class OutboundInvites
    {
        public int InviteID { get; set; }

        [Display(Name ="Instance Name")]
        public string InstanceName { get; set; }

        public string Sender { get; set; }
        public string Recipient { get; set; }

        [Display(Name ="Status")]
        public bool? Accepted { get; set; }
        public string accepted
        {
            get {
                return (Accepted == true ? "Accepted" : (Accepted == false ? "Declined" : "Pending"));
            } set { }
        }

        [Display(Name = "Sent on")]
        public DateTime DateSent { get; set; }

        [Display(Name = "Replied")]
        public DateTime? ReplySent { get; set; }

        public OutboundInvites(Invite i)
        {
            InviteID = i.InviteID;
            Sender = i.Sender;
            Recipient = i.Recipient;

            ApplicationDbContext db = new ApplicationDbContext();
            InstanceName = db.Instances.Find(i.InstanceID).Name;

            DateSent = i.DateSent;
            ReplySent = i.ReplySent;
        }
    }
}