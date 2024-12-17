namespace translator
{
    partial class Result
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;
        private TextBox textBox;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            components = new System.ComponentModel.Container();
            textBox = new TextBox();

            SuspendLayout();

            // 
            // textBox
            //
            textBox.Dock = DockStyle.Fill;
            textBox.Multiline = true;
            textBox.ReadOnly = true;
            textBox.ScrollBars = ScrollBars.Vertical;
            textBox.Font = new Font("Microsoft Sans Serif", 12F, FontStyle.Regular, GraphicsUnit.Point);

            //
            // Result
            //
            AutoScaleDimensions = new SizeF(10F, 25F);
            AutoScaleMode = AutoScaleMode.Font;
            ClientSize = new Size(800, 450);
            Controls.Add(textBox);
            StartPosition = FormStartPosition.Manual;
            Location = new Point(Screen.PrimaryScreen.WorkingArea.Width - ClientSize.Width, Screen.PrimaryScreen.WorkingArea.Height - ClientSize.Height - 50);
            Name = "Result";
            Text = "翻譯結果";
            ResumeLayout(false);
            PerformLayout();
        }

        public void SetText(string text)
        {
            textBox.Text = text;
        }
    }
}