using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Web;

namespace Genxyz.Models
{
    public class Link
    {
        public int LinkID { get; set; }

        public int OriginID { get; set; }
        public Node Origin { get; set; }

        public int TargetID { get; set; }
        public Node Target { get; set; }

        public string Type { get; set; }

        public bool Active { get; set; }

        public DateTime CreatedOn { get; set; }
        public DateTime LastModified { get; set; }

        public Link(){}

        public Link(CreateLink l)
        {
            OriginID = l.OriginID;
            TargetID = l.TargetID;
            Type = l.Type;
            Active = true;

            CreatedOn = DateTime.Now;
            LastModified = DateTime.Now;
        }

        public void RemoveLink()
        {
            if (Active) {
                LastModified = DateTime.Now;
                Active = false;
            }
        }

        public void ActivateLink()
        {
            if (!Active)
            {
                LastModified = DateTime.Now;
                Active = true;
            }
        }
    }

    public class CreateLink : IValidatableObject
    {
        public int OriginID { get; set; }
        public int TargetID { get; set; }
        public string Type { get; set; }

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            ApplicationDbContext db = new ApplicationDbContext();

            List<Link> links = db.Links.Where(x => x.Active).ToList();

            //make sure the nodes are in the same instance and that they exist.
            var Origin = db.Nodes.DefaultIfEmpty(null).FirstOrDefault(x => x.NodeID == OriginID);
            var Target = db.Nodes.DefaultIfEmpty(null).FirstOrDefault(x => x.NodeID == TargetID);

            if ( OriginID == TargetID)
            {
                yield return new ValidationResult("Cannot link to itself.");
            }

            if (Origin == null || Target == null || Origin.InstanceID != Target.InstanceID)
            {
                yield return new ValidationResult("Invalid nodes.");
            } else
            {
                var instance = db.Instances.Include("Members").FirstOrDefault(x=> x.InstanceID == Origin.InstanceID);
                if (!instance.Members.Any(x => x.UserName == Generic.GetUserName()))
                {
                    yield return new ValidationResult("Invalid nodes.");
                }
            }

            //check if there are any links at all for this item.
            var myLinks = links.Where(x => x.OriginID == OriginID || x.TargetID == OriginID || x.TargetID == OriginID || x.TargetID == TargetID);
            if (myLinks.Count() > 0)
            {
                //now check to see if there are any other  direct links with this originID and targetID.
                var directLinks = links.Where(x => (x.OriginID == OriginID && x.TargetID == TargetID) || (x.OriginID == TargetID && x.TargetID == OriginID));

                if (directLinks.Count() > 0)
                {
                    yield return new ValidationResult("There can only be one link between two objects.");
                }

                if (Type == "Parent")
                {
                    //scan through the parent, find if the child is ever the parent of the child.
                    var parentLinks = links.Where(x => x.OriginID == TargetID && x.Type == Type).ToList();
                    for (var i = 0; i < parentLinks.Count(); i++)
                    {
                        var p = parentLinks[i];

                        //scan through each one, check if the "parent" is the "target child".
                        if (p.TargetID == OriginID)
                        {
                            yield return new ValidationResult("Child would become Parent of Parent");
                            yield break;
                        }
                        //add the above parents to the list.
                        parentLinks.AddRange(links.Where(x => x.OriginID == p.OriginID && x.Type == Type).ToList());
                        parentLinks = parentLinks.Distinct().ToList();
                    }
                }
                //quick and dirty.
                else if (Type != "Parent" && Type != "Sibling")
                {
                    yield return new ValidationResult("Invalid link type.");
                }
            }
        }
    }
}