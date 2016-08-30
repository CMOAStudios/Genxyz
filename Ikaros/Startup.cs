using Microsoft.Owin;
using Owin;

[assembly: OwinStartupAttribute(typeof(Genxyz.Startup))]
namespace Genxyz
{
    public partial class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            ConfigureAuth(app);
        }
    }
}
