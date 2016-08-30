namespace Genxyz.Models
{
    public class Member
    {
        public virtual int MemberID { get; set; }

        public virtual Instance Instance { get; set; }
        public virtual int InstanceID { get; set; }

        public virtual string UserName { get; set; }
        //ranks and stuff here.
    }

    public class MemberList
    {
        public virtual int InstanceID { get; set; }
        public virtual int? MemberID { get; set; }
        public virtual int? InviteID { get; set; }

        public virtual string UserName { get; set; }
        public virtual string State { get; set; }

        public MemberList(Member m)
        {
            InstanceID = m.InstanceID;
            MemberID = m.MemberID;
            InviteID = null;
            UserName = Generic.GetUserDisplayName("", m.UserName);
            State = "Member";
        }

        public MemberList(Invite i)
        {
            InstanceID = i.InstanceID;
            MemberID = null;
            InviteID = i.InviteID;
            UserName = i.Recipient;
            State = "Pending";
        }

        public MemberList()
        {

        }
    }
}