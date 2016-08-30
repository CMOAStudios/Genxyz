using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Web;

namespace Genxyz.Models
{
    public class NodeType
    {
        public int NodeTypeID { get; set; }

        [Required]
        public string Name { get; set; }
        [Required]
        public string Color { get; set; }
        public int Importance { get; set; }

        [Required]
        public int InstanceID { get; set; }
        public Instance Instance { get; set; }
    }
}