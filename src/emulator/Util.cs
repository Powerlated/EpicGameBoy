using System;
using System.Collections;


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

    public static string Pad(string n, int width, char padChar)
    {
        return n.Length >= width ? n : string.Join(padChar, new int[width - (n.Length + 1)]) + n;
    }

    public static string RightPad(string n, int width, char z)
    {
        return n.Length >= width ? n : n + string.Join(z, new int[width - (n.Length + 1)]);
    }

    public static string Hex(long i, int digits)
    {
        return $"0x{Pad(i.ToString("X"), digits, '0').ToUpper()}";
    }

    public static string HexN(long i, int digits)
    {
        return $"{Pad(i.ToString("X"), digits, '0').ToUpper()}";
    }
}
