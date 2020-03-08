using DMSharp;
using System;
using System.IO;
using static Util;
class DMSharpEmulator
{
    public static void Main(string[] args)
    {

        var filename = "./gb-test-roms/cpu_instrs/individual/09-op r,r.gb";
        var filename2 = "./dmg_boot.bin";


        var c = getByteArrayFromFile(filename);
        var b = getByteArrayFromFile(filename2);
        var gb = new GameBoy();
        gb.bus.ext.ReplaceRom(c);
        gb.cpu.minDebug = true;
        Array.Copy(b, gb.bus.bootrom, b.Length);
        gb.bus.bootromLoaded = true;
        var doTimes = 1000;

        var startTime = TimeSpan.FromTicks(DateTime.Now.Ticks).TotalSeconds;
        for (var i = 0; i < doTimes; i++)
        {
            gb.Step();
            // Console.WriteLine(gb.cpu.lastInstruction);
        }

        var serial = System.Text.Encoding.UTF8.GetString(gb.bus.serialOut.ToArray());
        Console.WriteLine($"Serial: {serial}");
        var endTime = TimeSpan.FromTicks(DateTime.Now.Ticks).TotalSeconds;
        var deltaTime = endTime - startTime;
        Console.WriteLine($"Total Time: {deltaTime} seconds for {doTimes} instructions");
        Console.WriteLine($"Instructions per Second: {doTimes / deltaTime}");
        Console.WriteLine(Hex(gb.cpu.pc, 4));
    }

    public static byte[] getByteArrayFromFile(string filename)
    {
        Console.WriteLine(Directory.GetCurrentDirectory());
        using (FileStream fs = new FileStream(filename, FileMode.Open, FileAccess.Read))
        {
            // Create a byte array of file stream length
            byte[] bytes = System.IO.File.ReadAllBytes(filename);
            //Read block of bytes from stream into the byte array
            fs.Read(bytes, 0, System.Convert.ToInt32(fs.Length));
            //Close the File Stream
            fs.Close();
            return bytes;
        }
    }
}