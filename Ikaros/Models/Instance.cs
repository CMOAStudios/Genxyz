using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Web;

namespace Genxyz.Models
{
    public class Instance
    {
        public virtual int InstanceID { get; set; }

        public virtual string Name { get; set; }
        public virtual bool Active { get; set; }

        public string Creator { get; set; }
        public DateTime CreationDate { get; set; }

        public List<Member> Members { get; set; }
        public List<NodeType> NodeTypes { get; set; }

        public int InstanceConfigurationID { get; set; }
        public InstanceConfiguration InstanceConfiguration { get; set; }

        public virtual List<Layer> Layers { get; set; }
    }

    public class InstanceCreate
    {
        [Required]
        [MinLength(5, ErrorMessage = "Name needs to be at least 5 characters.")]
        public virtual string Name { get; set; }
    }

    public class InstanceIndex
    {
        public virtual int InstanceID { get; set; }

        public virtual string Name { get; set; }

        [Display(Name = "Created by")]
        public virtual string CreatorName { get; set; }

        [Display(Name = "Created on")]
        public virtual DateTime CreationDate { get; set; }

        public virtual string Creator { get; set; }

        public InstanceIndex(Instance i)
        {
            InstanceID = i.InstanceID;

            Name = i.Name;
            CreationDate = i.CreationDate;
            Creator = i.Creator;
            CreatorName = Generic.GetUserDisplayName("", i.Creator);
        }
    }

    public class InstanceEdit
    {
        [Required]
        [MinLength(5, ErrorMessage = "Name needs to be at least 5 characters.")]
        public virtual string Name { get; set; }

        //more stuff later?
    }

}