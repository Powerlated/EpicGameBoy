using OpenTK;
using OpenTK.Graphics;
using OpenTK.Graphics.OpenGL;
using OpenTK.Input;
using System;

namespace DMSharpEmulator
{
    public class Game : GameWindow
    {
        Shader shader;
        int VertexBufferObject;
        int VertexArrayObject;
        public Game(int width, int height, string title) : base(width, height, GraphicsMode.Default, title)
        {

        }

        float[] vertices = {
            -1f, -1f, 0.0f, //Bottom-left vertex
            1f, -1f, 0.0f, //Bottom-right vertex
            1f,  1f, 0.0f,  //Top vertex
            -1f, 1f, 0.0f
        };

        float[] texCoords = {
            0.0f, 0.0f,  // lower-left corner  
            1.0f, 0.0f,  // lower-right corner
            1.0f, 1.0f,  // top-right corner
            0.0f, 1.0f
        };

        protected override void OnLoad(EventArgs e)
        {
            VertexArrayObject = GL.GenVertexArray();
            GL.BindVertexArray(VertexArrayObject);
            // 2. copy our vertices array in a buffer for OpenGL to use
            GL.BindBuffer(BufferTarget.ArrayBuffer, VertexBufferObject);
            GL.BufferData(BufferTarget.ArrayBuffer, vertices.Length * sizeof(float), vertices, BufferUsageHint.StaticDraw);
            // 3. then set our vertex attributes pointers
            GL.VertexAttribPointer(0, 3, VertexAttribPointerType.Float, false, 3 * sizeof(float), 0);
            GL.EnableVertexAttribArray(0);
            shader = new Shader("src/shaders/shader.vert", "src/shaders/shader.frag");
            GL.ClearColor(0.2f, 0.3f, 0.3f, 1.0f);
            VertexBufferObject = GL.GenBuffer();

            base.OnLoad(e);
        }

        protected override void OnUpdateFrame(FrameEventArgs e)
        {
            KeyboardState input = Keyboard.GetState();

            if (input.IsKeyDown(Key.Escape))
            {
                Exit();
            }
            base.OnUpdateFrame(e);
        }

        protected override void OnRenderFrame(FrameEventArgs e)
        {

            GL.Clear(ClearBufferMask.ColorBufferBit);

            GL.BindBuffer(BufferTarget.ArrayBuffer, VertexBufferObject);
            GL.BufferData(BufferTarget.ArrayBuffer, vertices.Length * sizeof(float), vertices, BufferUsageHint.StaticDraw);

            GL.VertexAttribPointer(0, 3, VertexAttribPointerType.Float, false, 3 * sizeof(float), 0);
            GL.EnableVertexAttribArray(0);

            shader.Use();

            GL.BindVertexArray(VertexArrayObject);
            // drawTriangle();
            drawPixels();

            Context.SwapBuffers();
            base.OnRenderFrame(e);
        }

        void drawTriangle()
        {
            GL.BindVertexArray(VertexArrayObject);
            GL.DrawArrays(PrimitiveType.Quads, 0, 4);
        }

        void drawPixels()
        {
            var tex = GL.GenTexture();
            GL.BindTexture(TextureTarget.Texture2D, tex);

            GL.BlitFramebuffer(0, 0, 160, 144, 0, 0, 160, 144, ClearBufferMask.ColorBufferBit, BlitFramebufferFilter.Nearest);
        }
    }
}