using System.Net;
using System.Text;
using System.Windows.Forms;
using Newtonsoft.Json;
using YamlDotNet.Serialization;
using YamlDotNet.Serialization.NamingConventions;

namespace translator
{
    partial class Config
    {
        private System.ComponentModel.IContainer components = null;
        private NotifyIcon notifyIcon;
        private ContextMenuStrip contextMenuStrip;
        private ToolStripMenuItem configMenuItem;
        private ToolStripMenuItem exitMenuItem;

        private Label labelProxy;
        private TextBox textBoxProxy;
        private Label labelOpenAIKey;
        private TextBox textBoxOpenAIKey;
        private Label labelPrompt;
        private TextBox textBoxPrompt;
        private Button buttonSave;
        private Button buttonCancel;

        private string proxy;
        private string openAIKey;
        private string prompt;
        private const string ConfigFilePath = "translator.yaml";

        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        private void InitializeComponent()
        {
            components = new System.ComponentModel.Container();
            notifyIcon = new NotifyIcon(components);
            contextMenuStrip = new ContextMenuStrip(components);
            configMenuItem = new ToolStripMenuItem();
            exitMenuItem = new ToolStripMenuItem();

            labelProxy = new Label();
            textBoxProxy = new TextBox();
            labelOpenAIKey = new Label();
            textBoxOpenAIKey = new TextBox();
            labelPrompt = new Label();
            textBoxPrompt = new TextBox();
            buttonSave = new Button();
            buttonCancel = new Button();

            SuspendLayout();

            // 
            // notifyIcon
            // 
            notifyIcon.Icon = SystemIcons.Application;
            notifyIcon.Text = "翻譯器";
            notifyIcon.Visible = true;
            notifyIcon.ContextMenuStrip = contextMenuStrip;
            notifyIcon.MouseClick += new MouseEventHandler(NotifyIcon_MouseClick);

            // 
            // contextMenuStrip
            // 
            contextMenuStrip.Items.AddRange(new ToolStripItem[] {
            configMenuItem,
            exitMenuItem});

            // 
            // configMenuItem
            // 
            configMenuItem.Text = "配置";
            configMenuItem.Click += new EventHandler(ConfigMenuItem_Click);

            // 
            // exitMenuItem
            // 
            exitMenuItem.Text = "退出";
            exitMenuItem.Click += new EventHandler(ExitMenuItem_Click);

            // 
            // labelProxy
            // 
            labelProxy.AutoSize = true;
            labelProxy.Location = new Point(12, 15);
            labelProxy.Name = "labelProxy";
            labelProxy.Size = new Size(58, 20);
            labelProxy.Text = "Proxy";

            // 
            // textBoxProxy
            // 
            textBoxProxy.Location = new Point(150, 12);
            textBoxProxy.Name = "textBoxProxy";
            textBoxProxy.Size = new Size(300, 27);

            // 
            // labelOpenAIKey
            // 
            labelOpenAIKey.AutoSize = true;
            labelOpenAIKey.Location = new Point(12, 55);
            labelOpenAIKey.Name = "labelOpenAIKey";
            labelOpenAIKey.Size = new Size(100, 20);
            labelOpenAIKey.Text = "OpenAI Key";

            // 
            // textBoxOpenAIKey
            // 
            textBoxOpenAIKey.Location = new Point(150, 52);
            textBoxOpenAIKey.Name = "textBoxOpenAIKey";
            textBoxOpenAIKey.Size = new Size(300, 27);

            // 
            // labelPrompt
            // 
            labelPrompt.AutoSize = true;
            labelPrompt.Location = new Point(12, 95);
            labelPrompt.Name = "labelPrompt";
            labelPrompt.Size = new Size(58, 20);
            labelPrompt.Text = "Prompt";

            // 
            // textBoxPrompt
            // 
            textBoxPrompt.Location = new Point(150, 92);
            textBoxPrompt.Name = "textBoxPrompt";
            textBoxPrompt.Size = new Size(300, 27);

            // 
            // buttonSave
            // 
            buttonSave.Location = new Point(150, 135);
            buttonSave.Name = "buttonSave";
            buttonSave.Size = new Size(94, 29);
            buttonSave.Text = "保存";
            buttonSave.UseVisualStyleBackColor = true;
            buttonSave.Click += new EventHandler(ButtonSave_Click);

            // 
            // buttonCancel
            // 
            buttonCancel.Location = new Point(256, 135);
            buttonCancel.Name = "buttonCancel";
            buttonCancel.Size = new Size(94, 29);
            buttonCancel.Text = "取消";
            buttonCancel.UseVisualStyleBackColor = true;
            buttonCancel.Click += new EventHandler(ButtonCancel_Click);

            // 
            // Form1
            // 
            AutoScaleDimensions = new SizeF(10F, 25F);
            AutoScaleMode = AutoScaleMode.Font;
            ClientSize = new Size(500, 240);
            Controls.Add(labelProxy);
            Controls.Add(textBoxProxy);
            Controls.Add(labelOpenAIKey);
            Controls.Add(textBoxOpenAIKey);
            Controls.Add(labelPrompt);
            Controls.Add(textBoxPrompt);
            Controls.Add(buttonSave);
            Controls.Add(buttonCancel);
            Name = "Config";
            Text = "配置";
            StartPosition = FormStartPosition.CenterScreen;
            Load += new EventHandler(Form1_Load);
            Resize += new EventHandler(Form1_Resize);
            ResumeLayout(false);
            PerformLayout();
        }

        private void Form1_Load(object sender, EventArgs e)
        {
            WindowState = FormWindowState.Minimized;
            ShowInTaskbar = false;

            if (File.Exists(ConfigFilePath))
            {
                var yaml = new DeserializerBuilder()
                    .WithNamingConvention(CamelCaseNamingConvention.Instance)
                    .Build();
                var config = yaml.Deserialize<Dictionary<string, string>>(File.ReadAllText(ConfigFilePath));
                proxy = config["proxy"];
                openAIKey = config["openAIKey"];
                prompt = config["prompt"];
            }
            else
            {
                proxy = "";
                openAIKey = "";
                prompt = "";
            }

            textBoxProxy.Text = proxy;
            textBoxOpenAIKey.Text = openAIKey;
            textBoxPrompt.Text = prompt;
        }

        private void Form1_Resize(object sender, EventArgs e)
        {
            if (WindowState == FormWindowState.Minimized)
            {
                Hide();
            }
        }

        private void NotifyIcon_MouseClick(object sender, MouseEventArgs e)
        {
            if (e.Button == MouseButtons.Left)
            {
                Result resultForm = new Result();
                resultForm.Show();

                string clipboardText = Clipboard.GetText();
                string translatedText = "Translating...";

                resultForm.SetText(translatedText);
                try
                {
                    translatedText = Translate(clipboardText);
                }
                catch (Exception ex)
                {
                    translatedText = ex.Message;
                }
                resultForm.SetText(translatedText);
            }
        }

        private string Translate(string text)
        {
            HttpClientHandler httpClientHandler = null;
            if (!string.IsNullOrEmpty(proxy))
            {
                var proxyUri = new Uri(proxy);
                httpClientHandler = new HttpClientHandler
                {
                    Proxy = new WebProxy(proxyUri),
                    UseProxy = true
                };
            }

            using (var client = httpClientHandler != null ? new HttpClient(httpClientHandler) : new HttpClient())
            {
                client.DefaultRequestHeaders.Add("Authorization", $"Bearer {openAIKey}");

                var requestBody = new
                {
                    model = "gpt-4o-mini",
                    messages = new[] {
                        new { role = "system", content = prompt },
                        new { role = "user", content = text },
                    },
                };

                var content = new StringContent(JsonConvert.SerializeObject(requestBody), Encoding.UTF8, "application/json");
                var response = client.PostAsync("https://api.openai.com/v1/chat/completions", content).Result;

                if (response.IsSuccessStatusCode)
                {
                    var responseContent = response.Content.ReadAsStringAsync().Result;
                    dynamic result = JsonConvert.DeserializeObject(responseContent);

                    string responseText = "";
                    if (result != null)
                    {
                        if (result.ContainsKey("choices") && result.choices.Count > 0)
                        {
                            responseText = result.choices[0].message.content;
                        }
                    }
                    if (string.IsNullOrEmpty(responseText))
                    {
                        responseText = responseContent.ToString();
                    }
                    return responseText;
                }
                else
                {
                    throw new Exception("Translation failed: " + response.ReasonPhrase);
                }
            }
        }

        private void ConfigMenuItem_Click(object sender, EventArgs e)
        {
            Show();
            WindowState = FormWindowState.Normal;
            ShowInTaskbar = true;
        }

        private void ExitMenuItem_Click(object sender, EventArgs e)
        {
            Application.Exit();
        }
        private void ButtonSave_Click(object sender, EventArgs e)
        {
            proxy = textBoxProxy.Text;
            openAIKey = textBoxOpenAIKey.Text;
            prompt = textBoxPrompt.Text;

            var config = new Dictionary<string, string>
            {
                { "proxy", proxy },
                { "openAIKey", openAIKey },
                { "prompt", prompt }
            };

            var yaml = new SerializerBuilder()
                .WithNamingConvention(CamelCaseNamingConvention.Instance)
                .Build();
            File.WriteAllText(ConfigFilePath, yaml.Serialize(config));

            MessageBox.Show("保存成功", "提示", MessageBoxButtons.OK, MessageBoxIcon.Information);
        }
        private void ButtonCancel_Click(object sender, EventArgs e)
        {
            if (File.Exists(ConfigFilePath))
            {
                var yaml = new DeserializerBuilder()
                    .WithNamingConvention(CamelCaseNamingConvention.Instance)
                    .Build();
                var config = yaml.Deserialize<Dictionary<string, string>>(File.ReadAllText(ConfigFilePath));
                proxy = config["proxy"];
                openAIKey = config["openAIKey"];
                prompt = config["prompt"];
            }
            else
            {
                proxy = "";
                openAIKey = "";
                prompt = "";
            }

            textBoxProxy.Text = proxy;
            textBoxOpenAIKey.Text = openAIKey;
            textBoxPrompt.Text = prompt;

            Hide();
        }

        protected override CreateParams CreateParams
        {
            get
            {
                CreateParams cp = base.CreateParams;
                const int CS_NOCLOSE = 0x200;
                cp.ClassStyle |= CS_NOCLOSE;
                return cp;
            }
        }

    }
}
