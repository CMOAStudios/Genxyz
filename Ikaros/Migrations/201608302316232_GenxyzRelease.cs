namespace Genxyz.Migrations
{
    using System;
    using System.Data.Entity.Migrations;
    
    public partial class GenxyzRelease : DbMigration
    {
        public override void Up()
        {
            CreateTable(
                "dbo.InstanceConfigurations",
                c => new
                    {
                        InstanceConfigurationID = c.Int(nullable: false, identity: true),
                        DisplayName = c.String(),
                        BackgroundColor = c.String(),
                    })
                .PrimaryKey(t => t.InstanceConfigurationID);
            
            CreateTable(
                "dbo.Instances",
                c => new
                    {
                        InstanceID = c.Int(nullable: false, identity: true),
                        Name = c.String(),
                        Active = c.Boolean(nullable: false),
                        Creator = c.String(),
                        CreationDate = c.DateTime(nullable: false),
                        InstanceConfigurationID = c.Int(nullable: false),
                    })
                .PrimaryKey(t => t.InstanceID)
                .ForeignKey("dbo.InstanceConfigurations", t => t.InstanceConfigurationID, cascadeDelete: true)
                .Index(t => t.InstanceConfigurationID);
            
            CreateTable(
                "dbo.Layers",
                c => new
                    {
                        LayerID = c.Int(nullable: false, identity: true),
                        Name = c.String(nullable: false),
                        InstanceID = c.Int(nullable: false),
                        Active = c.Boolean(nullable: false),
                        CreatedOn = c.DateTime(nullable: false),
                        LastModified = c.DateTime(nullable: false),
                    })
                .PrimaryKey(t => t.LayerID)
                .ForeignKey("dbo.Instances", t => t.InstanceID, cascadeDelete: true)
                .Index(t => t.InstanceID);
            
            CreateTable(
                "dbo.LayerLinks",
                c => new
                    {
                        LayerLinkID = c.Int(nullable: false, identity: true),
                        LayerID = c.Int(nullable: false),
                        NodeID = c.Int(nullable: false),
                        Active = c.Boolean(nullable: false),
                        CreatedOn = c.DateTime(nullable: false),
                        LastModified = c.DateTime(nullable: false),
                    })
                .PrimaryKey(t => t.LayerLinkID)
                .ForeignKey("dbo.Layers", t => t.LayerID, cascadeDelete: true)
                .ForeignKey("dbo.Nodes", t => t.NodeID, cascadeDelete: true)
                .Index(t => t.LayerID)
                .Index(t => t.NodeID);
            
            CreateTable(
                "dbo.Nodes",
                c => new
                    {
                        NodeID = c.Int(nullable: false, identity: true),
                        InstanceID = c.Int(nullable: false),
                        Name = c.String(),
                        Comments = c.String(),
                        xPos = c.Single(nullable: false),
                        yPos = c.Single(nullable: false),
                        zPos = c.Single(nullable: false),
                        Active = c.Boolean(nullable: false),
                        CreatedOn = c.DateTime(nullable: false),
                        LastModified = c.DateTime(nullable: false),
                    })
                .PrimaryKey(t => t.NodeID);
            
            CreateTable(
                "dbo.Links",
                c => new
                    {
                        LinkID = c.Int(nullable: false, identity: true),
                        OriginID = c.Int(nullable: false),
                        TargetID = c.Int(nullable: false),
                        Type = c.String(),
                        Active = c.Boolean(nullable: false),
                        CreatedOn = c.DateTime(nullable: false),
                        LastModified = c.DateTime(nullable: false),
                        Origin_NodeID = c.Int(),
                        Target_NodeID = c.Int(),
                        Node_NodeID = c.Int(),
                    })
                .PrimaryKey(t => t.LinkID)
                .ForeignKey("dbo.Nodes", t => t.Origin_NodeID)
                .ForeignKey("dbo.Nodes", t => t.Target_NodeID)
                .ForeignKey("dbo.Nodes", t => t.Node_NodeID)
                .Index(t => t.Origin_NodeID)
                .Index(t => t.Target_NodeID)
                .Index(t => t.Node_NodeID);
            
            CreateTable(
                "dbo.Members",
                c => new
                    {
                        MemberID = c.Int(nullable: false, identity: true),
                        InstanceID = c.Int(nullable: false),
                        UserName = c.String(),
                    })
                .PrimaryKey(t => t.MemberID)
                .ForeignKey("dbo.Instances", t => t.InstanceID, cascadeDelete: true)
                .Index(t => t.InstanceID);
            
            CreateTable(
                "dbo.NodeTypes",
                c => new
                    {
                        NodeTypeID = c.Int(nullable: false, identity: true),
                        Name = c.String(nullable: false),
                        Color = c.String(nullable: false),
                        Importance = c.Int(nullable: false),
                        InstanceID = c.Int(nullable: false),
                    })
                .PrimaryKey(t => t.NodeTypeID)
                .ForeignKey("dbo.Instances", t => t.InstanceID, cascadeDelete: true)
                .Index(t => t.InstanceID);
            
            CreateTable(
                "dbo.Invites",
                c => new
                    {
                        InviteID = c.Int(nullable: false, identity: true),
                        Active = c.Boolean(nullable: false),
                        Accepted = c.Boolean(),
                        InstanceID = c.Int(nullable: false),
                        Sender = c.String(),
                        Recipient = c.String(nullable: false),
                        DateSent = c.DateTime(nullable: false),
                        ReplySent = c.DateTime(),
                    })
                .PrimaryKey(t => t.InviteID);
            
            CreateTable(
                "dbo.AspNetRoles",
                c => new
                    {
                        Id = c.String(nullable: false, maxLength: 128),
                        Name = c.String(nullable: false, maxLength: 256),
                    })
                .PrimaryKey(t => t.Id)
                .Index(t => t.Name, unique: true, name: "RoleNameIndex");
            
            CreateTable(
                "dbo.AspNetUserRoles",
                c => new
                    {
                        UserId = c.String(nullable: false, maxLength: 128),
                        RoleId = c.String(nullable: false, maxLength: 128),
                    })
                .PrimaryKey(t => new { t.UserId, t.RoleId })
                .ForeignKey("dbo.AspNetRoles", t => t.RoleId, cascadeDelete: true)
                .ForeignKey("dbo.AspNetUsers", t => t.UserId, cascadeDelete: true)
                .Index(t => t.UserId)
                .Index(t => t.RoleId);
            
            CreateTable(
                "dbo.AspNetUsers",
                c => new
                    {
                        Id = c.String(nullable: false, maxLength: 128),
                        FirstName = c.String(),
                        LastName = c.String(),
                        FullName = c.String(),
                        Email = c.String(maxLength: 256),
                        EmailConfirmed = c.Boolean(nullable: false),
                        PasswordHash = c.String(),
                        SecurityStamp = c.String(),
                        PhoneNumber = c.String(),
                        PhoneNumberConfirmed = c.Boolean(nullable: false),
                        TwoFactorEnabled = c.Boolean(nullable: false),
                        LockoutEndDateUtc = c.DateTime(),
                        LockoutEnabled = c.Boolean(nullable: false),
                        AccessFailedCount = c.Int(nullable: false),
                        UserName = c.String(nullable: false, maxLength: 256),
                    })
                .PrimaryKey(t => t.Id)
                .Index(t => t.UserName, unique: true, name: "UserNameIndex");
            
            CreateTable(
                "dbo.AspNetUserClaims",
                c => new
                    {
                        Id = c.Int(nullable: false, identity: true),
                        UserId = c.String(nullable: false, maxLength: 128),
                        ClaimType = c.String(),
                        ClaimValue = c.String(),
                    })
                .PrimaryKey(t => t.Id)
                .ForeignKey("dbo.AspNetUsers", t => t.UserId, cascadeDelete: true)
                .Index(t => t.UserId);
            
            CreateTable(
                "dbo.AspNetUserLogins",
                c => new
                    {
                        LoginProvider = c.String(nullable: false, maxLength: 128),
                        ProviderKey = c.String(nullable: false, maxLength: 128),
                        UserId = c.String(nullable: false, maxLength: 128),
                    })
                .PrimaryKey(t => new { t.LoginProvider, t.ProviderKey, t.UserId })
                .ForeignKey("dbo.AspNetUsers", t => t.UserId, cascadeDelete: true)
                .Index(t => t.UserId);
            
        }
        
        public override void Down()
        {
            DropForeignKey("dbo.AspNetUserRoles", "UserId", "dbo.AspNetUsers");
            DropForeignKey("dbo.AspNetUserLogins", "UserId", "dbo.AspNetUsers");
            DropForeignKey("dbo.AspNetUserClaims", "UserId", "dbo.AspNetUsers");
            DropForeignKey("dbo.AspNetUserRoles", "RoleId", "dbo.AspNetRoles");
            DropForeignKey("dbo.NodeTypes", "InstanceID", "dbo.Instances");
            DropForeignKey("dbo.Members", "InstanceID", "dbo.Instances");
            DropForeignKey("dbo.LayerLinks", "NodeID", "dbo.Nodes");
            DropForeignKey("dbo.Links", "Node_NodeID", "dbo.Nodes");
            DropForeignKey("dbo.Links", "Target_NodeID", "dbo.Nodes");
            DropForeignKey("dbo.Links", "Origin_NodeID", "dbo.Nodes");
            DropForeignKey("dbo.LayerLinks", "LayerID", "dbo.Layers");
            DropForeignKey("dbo.Layers", "InstanceID", "dbo.Instances");
            DropForeignKey("dbo.Instances", "InstanceConfigurationID", "dbo.InstanceConfigurations");
            DropIndex("dbo.AspNetUserLogins", new[] { "UserId" });
            DropIndex("dbo.AspNetUserClaims", new[] { "UserId" });
            DropIndex("dbo.AspNetUsers", "UserNameIndex");
            DropIndex("dbo.AspNetUserRoles", new[] { "RoleId" });
            DropIndex("dbo.AspNetUserRoles", new[] { "UserId" });
            DropIndex("dbo.AspNetRoles", "RoleNameIndex");
            DropIndex("dbo.NodeTypes", new[] { "InstanceID" });
            DropIndex("dbo.Members", new[] { "InstanceID" });
            DropIndex("dbo.Links", new[] { "Node_NodeID" });
            DropIndex("dbo.Links", new[] { "Target_NodeID" });
            DropIndex("dbo.Links", new[] { "Origin_NodeID" });
            DropIndex("dbo.LayerLinks", new[] { "NodeID" });
            DropIndex("dbo.LayerLinks", new[] { "LayerID" });
            DropIndex("dbo.Layers", new[] { "InstanceID" });
            DropIndex("dbo.Instances", new[] { "InstanceConfigurationID" });
            DropTable("dbo.AspNetUserLogins");
            DropTable("dbo.AspNetUserClaims");
            DropTable("dbo.AspNetUsers");
            DropTable("dbo.AspNetUserRoles");
            DropTable("dbo.AspNetRoles");
            DropTable("dbo.Invites");
            DropTable("dbo.NodeTypes");
            DropTable("dbo.Members");
            DropTable("dbo.Links");
            DropTable("dbo.Nodes");
            DropTable("dbo.LayerLinks");
            DropTable("dbo.Layers");
            DropTable("dbo.Instances");
            DropTable("dbo.InstanceConfigurations");
        }
    }
}
