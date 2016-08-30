using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Genxyz
{
    public static class HTMLHelpers
    {
        private static TagBuilder BaseButton(string text)
        {
            var builder = new TagBuilder("span");
            builder.AddCssClass("btn");
            builder.SetInnerText(text);
            return builder;
        }

        public static MvcHtmlString FormSubmitButton(string text)
        {
            var builder = BaseButton(text);

            builder.AddCssClass("btn-default submit-form-button");

            return MvcHtmlString.Create(builder.ToString(TagRenderMode.Normal));
        }

        public static MvcHtmlString FormSubmitButton(string text, string[] buttonClasses)
        {
            var builder = BaseButton(text);

            for (int i = 0; i < buttonClasses.Length; i++)
            {
                builder.AddCssClass(string.Format("btn-{0}", buttonClasses[i]));
            }

            builder.AddCssClass("submit-form-button");

            return MvcHtmlString.Create(builder.ToString(TagRenderMode.Normal));
        }
    }
}