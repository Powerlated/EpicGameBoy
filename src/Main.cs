using DMSharp;
using System;
using System.IO;
using static Util;

namespace DMSharpEmulator
{
    class DMSharpEmulator
    {
        static GameBoy gb = new GameBoy();
        public static void Main(string[] args)
        {
            // var b = getByteArrayFromFile(filename2);
            //  Array.Copy(b, gb.bus.bootrom, b.Length);

            var gamePath = "./pokeyellow.gbc";
            var c = getByteArrayFromFile(gamePath);
            gb.bus.ext.ReplaceRom(c);

            using (Game game = new Game(160 * 4, 144 * 4, "DMSharp", gb))
            {
                //Run takes a double, which is how many frames per second it should strive to reach.
                //You can leave that out and it'll just update as fast as the hardware will allow it.
                game.VSync = OpenTK.VSyncMode.On;
                game.Run(60.0, 60.0);
            }
            // gb.cpu.minDebug = true;

            // gb.bus.bootromLoaded = false;
            // // gb.cpu.logging = true;
            // // gb.cpu.debugging = true;
            // var doTimes = 52050850;

            // var startTime = TimeSpan.FromTicks(DateTime.Now.Ticks).TotalSeconds;
            // for (var i = 0; i < doTimes; i++)
            // {
            //     gb.Step();
            // }

            // System.IO.File.WriteAllLines("DMSharp.log", gb.cpu.log);

            // var serial = System.Text.Encoding.UTF8.GetString(gb.bus.serialOut.ToArray());
            // Console.WriteLine($"Serial: {serial}");
            // var endTime = TimeSpan.FromTicks(DateTime.Now.Ticks).TotalSeconds;
            // var deltaTime = endTime - startTime;
            // Console.WriteLine($"Total Time: {deltaTime} seconds for {doTimes} instructions");
            // Console.WriteLine($"Instructions per Second: {doTimes / deltaTime}");
            // Console.WriteLine(Hex(gb.cpu.pc, 4));
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
}