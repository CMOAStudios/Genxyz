using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Genxyz.Models;
using Microsoft.AspNet.Identity.EntityFramework;

namespace Genxyz.Models
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext()
            : base("DefaultConnection", throwIfV1Schema: false)
        {
        }

        public static ApplicationDbContext Create()
        {
            return new ApplicationDbContext();
        }
        
        public System.Data.Entity.DbSet<Genxyz.Models.Node> Nodes { get; set; }
        public System.Data.Entity.DbSet<Genxyz.Models.NodeType> NoteTypes { get; set; }
        public System.Data.Entity.DbSet<Genxyz.Models.Link> Links { get; set; }
        public System.Data.Entity.DbSet<Genxyz.Models.Instance> Instances { get; set; }
        public System.Data.Entity.DbSet<Genxyz.Models.Invite> Invites { get; set; }
        public System.Data.Entity.DbSet<Genxyz.Models.Member> Members { get; set; }
        public System.Data.Entity.DbSet<Genxyz.Models.Layer> Layers { get; set; }
        public System.Data.Entity.DbSet<Genxyz.Models.LayerLink> LayerLinks { get; set; }

        public System.Data.Entity.DbSet<Genxyz.Models.InstanceConfiguration> InstanceConfigurations { get; set; }
    }
}