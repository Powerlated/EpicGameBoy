using OpenTK;
using OpenTK.Graphics;
using OpenTK.Graphics.OpenGL;
using OpenTK.Input;
using System;
using DMSharp;

namespace DMSharpEmulator
{
    public class Game : GameWindow
    {
        Shader shader;
        int VertexBufferObject;
        int VertexArrayObject;
        GameBoy gb;
        public Game(int width, int height, string title, GameBoy gb) : base(width, height, GraphicsMode.Default, title)
        {
            this.gb = gb;
        }

        float[] vertices = {
            1f,  1f, 0.0f, 1.0f, 0.0f, // top right
            1f, -1f, 0.0f, 1.0f, 1.0f, // bottom right
            -1f, -1f, 0.0f, 0.0f, 1.0f, // bottom left
            -1f,  1f, 0.0f, 0.0f, 0.0f  // top left
        };
        protected override void OnLoad(EventArgs e)
        {
            VertexArrayObject = GL.GenVertexArray();
            shader = new Shader("src/shaders/shader.vert", "src/shaders/shader.frag");
            GL.ClearColor(0.2f, 0.3f, 0.3f, 1.0f);
            VertexBufferObject = GL.GenBuffer();

            GL.Enable(EnableCap.Texture2D);
            // Disable texture filtering
            GL.TexParameter(TextureTarget.Texture2D, TextureParameterName.TextureMagFilter, (int)TextureMagFilter.Nearest);
            GL.TexParameter(TextureTarget.Texture2D, TextureParameterName.TextureMinFilter, (int)TextureMagFilter.Nearest);

            base.OnLoad(e);
        }

        protected override void OnUpdateFrame(FrameEventArgs e)
        {
            KeyboardState input = Keyboard.GetState();

            if (input.IsKeyUp(Key.Z))
                gb.joypad.b = false;
            if (input.IsKeyUp(Key.X))
                gb.joypad.a = false;
            if (input.IsKeyUp(Key.Enter))
                gb.joypad.start = false;
            if (input.IsKeyUp(Key.BackSpace))
                gb.joypad.select = false;
            if (input.IsKeyUp(Key.Left))
                gb.joypad.left = false;
            if (input.IsKeyUp(Key.Up))
                gb.joypad.up = false;
            if (input.IsKeyUp(Key.Right))
                gb.joypad.right = false;
            if (input.IsKeyUp(Key.Down))
                gb.joypad.down = false;

            if (input.IsKeyDown(Key.Z))
                gb.joypad.b = true;
            if (input.IsKeyDown(Key.X))
                gb.joypad.a = true;
            if (input.IsKeyDown(Key.Enter))
                gb.joypad.start = true;
            if (input.IsKeyDown(Key.BackSpace))
                gb.joypad.select = true;
            if (input.IsKeyDown(Key.Left))
                gb.joypad.left = true;
            if (input.IsKeyDown(Key.Up))
                gb.joypad.up = true;
            if (input.IsKeyDown(Key.Right))
                gb.joypad.right = true;
            if (input.IsKeyDown(Key.Down))
                gb.joypad.down = true;


            if (input.IsKeyDown(Key.Tab))
                gb.speedMul = 8;
            if (input.IsKeyUp(Key.Tab))
                gb.speedMul = 1;

            gb.frame();





            if (input.IsKeyDown(Key.Escape))
            {
                Exit();
            }

            if (input.IsKeyDown(Key.ControlLeft) && input.IsKeyDown(Key.R))
            {
                gb.Reset();
            }

            base.OnUpdateFrame(e);
        }

        protected override void OnRenderFrame(FrameEventArgs e)
        {
            byte[] pixels = gb.gpu.imageGameboyOut;

            shader.Use();

            GL.TexImage2D(
                TextureTarget.Texture2D,
                0,
                PixelInternalFormat.Rgb,
                160,
                144,
                0,
                PixelFormat.Rgb,
                PixelType.UnsignedByte,
                pixels
            );

            GL.BindBuffer(BufferTarget.ArrayBuffer, VertexBufferObject);
            GL.BufferData(BufferTarget.ArrayBuffer, vertices.Length * sizeof(float), vertices, BufferUsageHint.StaticDraw);

            GL.VertexAttribPointer(0, 3, VertexAttribPointerType.Float, false, 5 * sizeof(float), 0);
            int texCoordLocation = shader.GetAttribLocation("aTexCoord");
            GL.EnableVertexAttribArray(texCoordLocation);
            GL.VertexAttribPointer(texCoordLocation, 2, VertexAttribPointerType.Float, false, 5 * sizeof(float), 3 * sizeof(float));
            GL.EnableVertexAttribArray(0);

            GL.BindVertexArray(VertexArrayObject);
            GL.DrawArrays(PrimitiveType.Quads, 0, 4);

            GL.Flush();
            Context.SwapBuffers();

        }
    }
}