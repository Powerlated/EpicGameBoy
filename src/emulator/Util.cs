using System;
using System.Collections;

namespace DMSharp
{

    static class Util
    {
        public static void Each<T>(this System.Collections.Generic.IEnumerable<T> ie, Action<T, int> action)
        {
            var i = 0;
            foreach (var e in ie) action(e, i++);
        }


        public static void WriteDebug(string text)
        {
            Console.WriteLine(text);
        }

        public static string Pad(string n, int width, string z)
        {
            return n.Length >= width ? n : n + string.Join(n, new int[width - n.Length + 1]);
        }

        public static string RightPad(string n, int width, string z)
        {
            return n.Length >= width ? n : n + string.Join(n, new int[width - n.Length + 1]);
        }

        public static string Hex(long i, int digits)
        {
            return $"0x{Pad(i.ToString("X"), digits, "0").ToUpper()}";
        }
    }
}