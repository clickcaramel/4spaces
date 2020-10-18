# Основы Metal

Metal - это основной API компьютерной графики от Apple, и после прекращения поддержки OpenGL, единственный графический API, поддерживаемый Apple.

![](https://miro.medium.com/max/1024/1*2UZ78SEksWWjl2FdGmF40A.png "Metal Logo")

Metal ограничен только операционными системами Apple:
* 🍎 Mac OS
* 📱 iOS / iPad OS

Metal также ограничен только несколькими языками программирования:
* Objective C
* Objective C++
* Swift

Несмотря на эти ограничения, Apple Metal представляет собой чрезвычайно элегантный, лаконичный и надежный API с достойной поддержкой на всех поддерживаемых Apple платформах. Также стоит отметить, что один и тот же код в Apple Metal обычно требует значительно меньше строк кода, чем, например, с Vulkan или DirectX 12.

Я подготовил [Github репозиторий](http://github.com/alaingalvan/metal-seed) со всем необходимым для начала работы. Мы создадим приложение Hello Triangle на C++ - простенькую программу, которая создает треугольник и отображает его на экране.

## Подготовка

Для начала вам нужно установить:
* [Git](https://git-scm.com/)
* [CMake](https://cmake.org/)
* IDE [Visual Studio](https://visualstudio.microsoft.com/downloads/), [XCode](https://developer.apple.com/xcode/), или просто компилятор [GCC](https://gcc.gnu.org/).

Далее откройте и напишите в консоли следующее.
```
# 🐑 Клонируем репозиторий
git clone https://github.com/alaingalvan/metal-seed --recurse-submodules

# 💿 Идем в полученную директорию
cd metal-seed

# 👯 Обновляем подмодули репозитория:
git submodule update --init

# 👷 Создаем build директорию
mkdir build
cd build

# 🖼️ Если вы хотите собрать ваш Visual Studio проект под Windows x64
cmake .. -A x64

# 🍎 Если вы хотите собрать ваш XCode проект под Mac OS
cmake .. -G Xcode

# 🍎 Если вы хотите собрать ваш XCode проект для iOS / iPad OS
cmake .. -G Xcode -DCMAKE_SYSTEM_NAME=iOS

# 🐧 Если вы хотите запустить .make файл под Linux
cmake ..

# 🔨 Сборка под любую платформу:
cmake --build .
```

## Разбираем код

Ниже будут разобраны части кода, который можно найти в [репозитории на Github](http://github.com/alaingalvan/metal-seed). Однако, некоторые части пропущены и переменные (mMemberVariable) объявленные без префикса m, чтобы было проще читать. Тем не менее, приведенные здесь примеры самодостаточны и тоже должны работать сами по себе.

### Создание окна для отрисовки

![](https://miro.medium.com/max/1400/1*tlVSJV9UUNFOB1pV_I965A.png Screenshot)

Мы используем CrossWindow для создания кроссплатформенных окон, поэтому создать окно и обновить его очень просто:
```
#include "CrossWindow/CrossWindow.h"
#include "Renderer.h"
#include <iostream>
void xmain(int argc, const char** argv)
{
  // 🖼 Создаем окно
  xwin::WindowDesc wdesc;
  wdesc.title = "Metal Seed";
  wdesc.name = "MainWindow";
  wdesc.visible = true;
  wdesc.width = 640;
  wdesc.height = 640;
  wdesc.fullscreen = false;
  xwin::Window window;
  xwin::EventQueue eventQueue;
  if (!window.create(wdesc, eventQueue))
  { return; };
  // 🌋 Создаем renderer
  Renderer renderer(window);
  // 🏁 Цикл нашего движка
  bool isRunning = true;
  while (isRunning)
  {
    bool shouldRender = true;
    // ♻️  Обновляем очередь событий
    eventQueue.update();
    // 🎈 Итерируем по этой очереди:
    while (!eventQueue.empty())
    {
      // Обновляем события
      const xwin::Event& event = eventQueue.front();
      // 💗 Если изменили размер окна:
      if (event.type == xwin::EventType::Resize)
      {
        const xwin::ResizeData data = event.data.resize;
        renderer.resize(data.width, data.height);
        shouldRender = false;
      }
      // ❌ Обрабатываем закрытие окна:
      if (event.type == xwin::EventType::Close)
      {
        window.close();
        shouldRender = false;
        isRunning = false;
      }
      eventQueue.pop();
    }
    // ✨ Собственно, отрисовка
    if (shouldRender)
    {
      renderer.render();
    }
  }
}
```

Обратите внимание, что в iOS, iPadOS, tvOS и watchOS внутри будет использоватся API **UIKit**, а MacOS – API **Cocoa** для отрисовки окон.

## Иницилиазируем API

### Слой Metal'а

Каждое окно может иметь прикрепленные к нему слои, которые будут обрабатывать OpenGL или Metal.

```
// ☕ Используем CrossWindow-Graphics, чтобы создать слой для Metal
xgfx::createMetalLayer(&window);
xwin::WindowDelegate& del = window.getDelegate();
CAMetalLayer* layer = (CAMetalLayer*)del.layer;
```
### Device

![](https://miro.medium.com/max/1400/1*Ts_q10OugkQreJg_RR6YOQ.png Device)

Device – входная точка для Metal API.

```
// 👋 Объявляем Device
MTLCommandBuffer* device;

// 🎮 Создаем Device
layer.device = MTLCreateSystemDefaultDevice();
device = layer.device;
```

### Очередь команд

![](https://miro.medium.com/max/1400/1*evj8DBsNe5CG_93OIX93gg.png)

Очередь команд работает аналогично на всех современных графических API - очередь, через которую вы будете отправлять вызовы графических функций в GPU.

```
// 👋 Объявляем очередь
MTLCommandQueue* commandQueue;

// 📦 Создаем очередь
commandQueue = [device newCommandQueue];
```

## Инициализация ресурсов

### Буферы вершин (VBO)

![](https://miro.medium.com/max/1400/1*SuAsA5dEdh-rWiVk-91E0w.png "Vertex Buffer")

Буферы вершин (VBO) - это блоки данных, хранящиеся в GPU, которые ипользуются для создания треугольников в нашем приложении.

Вы можете описать эти данные одним большим буфером, содержащим все вершины, или независимыми массивами для каждой вершины, в зависимости от вашего сценария использования и требований к производительности.

Разделение вершин на отдельные массивы может быть полезно, если вы часто обновляете данные вершин.

```
// 📈 Описываем координаты в виде одного большого массива
float positions[3*3] = { 1.0f,  1.0f,  0.0f,
                        -1.0f,  1.0f,  0.0f,
                         0.0f, -1.0f,  0.0f };
// 🎨 Описываем цвета вершин
float colors[3*3] = { 1.0f,  0.0f,  0.0f,
                      0.0f,  1.0f,  0.0f,
                      0.0f,  0.0f,  1.0f };

// 👋 Объявляем собственно буферы
MTLBuffer* positionBuffer;
MTLBuffer* colorBuffer;

// ⚪ Создаем буфер для координат вершин
positionBuffer = [device newBufferWithLength:sizeof(Vertex) * 3
                                    options:MTLResourceOptionCPUCacheModeDefault];
// 💬 Задаем название буферу
[positionBuffer setLabel:@"PositionBuffer"];

// 💾 Копируем массив с координатами в буфер
memcpy(positionBuffer.contents, positions, sizeof(float) * 3 * 3);

// ⚪ Создаем буфер для цветов вершин
colorBuffer = [device newBufferWithLength:sizeof(Vertex) * 3
                                 options:MTLResourceOptionCPUCacheModeDefault];
// 💬 Задаем название буферу
[colorBuffer setLabel:@"ColorBuffer"];

// 💾 Копируем массив с цветами в буфер
memcpy(colorBuffer.contents, colors, sizeof(float) * 3 * 3);
```

### Индексный (IBO) буфер

![](https://miro.medium.com/max/1400/1*zK6Tddx9ymxOhyzLTha0Jw.png)

Индексный буфер (IBO) - это, по сути, массив указателей на буфер вершин. Это позволяет вам менять местами данные вершин и повторно использовать существующие данные для нескольких вершин.

Если вы создаете треугольники, в индексном буфере должно быть 3 точки на каждый треугольник, для линий должно быть 2, а для точек нужна только 1.

```
// 🗄️ Данные индексного буфера
unsigned indexBufferData[3] = { 0, 1, 2 };

// ✋ Объявляем буффер
MTLBuffer* indexBuffer;

// 🃏 Создаем буффер
indexBuffer = [device newBufferWithLength:sizeof(unsigned) * 3
                                    options:MTLResourceOptionCPUCacheModeDefault];

// 💬 Задаем название буферу
[indexBuffer setLabel:@"IBO"];

// 💾 Копируем массив с индексами в буфер
memcpy(indexBuffer.contents, indexBufferData, sizeof(unsigned) * 3);
```

### UBO буферы

UBO (Uniform Buffer Objects) - это блоки памяти, описывающие данные, которые должны быть отправлены вашему шейдеру во время рендеринга, например данные для управления эффектами, позиционные матрицы и т. д.

Основное преимущество использования унифицированных буферов состоит в том, что они могут использоваться несколькими шейдерами. Тогда одного UBO будет достаточно для всех шейдеров, использующих одни и те же данные.

```
// 👋 Объявляем буфер
MTLBuffer* uniformBuffer;

// 🗄️ Описываем необходимые данные
struct UniformData
{
    mat4 projectionMatrix;
    mat4 modelMatrix;
    mat4 viewMatrix;
} uboVS;

// 🎛️ Создаем буфер
uniformBuffer = [device newBufferWithLength:(sizeof(UniformData) + 255) & ~255
                                      options:MTLResourceOptionCPUCacheModeDefault];

// 💬 Задаем название буферу
[uniformBuffer setLabel:@"UBO"];

// Создаем UBO и копируем в буфер...
```

### Shader библиотеки

![](https://miro.medium.com/max/1400/1*X4u3w7GCFCIERpzyzjzl5Q.png)

Библиотеки шейдеров msl – это особенность Metal, и представляют из себя .msl файлы содержащие в себе шейдеры.

```
// Загружаем все файлы с расширением .msl

NSError* err = nil;

// 📂 Загружаем файлы, в конец нужно добавить термнирующий 0
std::vector<char> vertSource = readFile("triangle.vert.msl");
vertSource.emplace_back(0);
std::vector<char> fragSource = readFile("triangle.frag.msl");
fragSource.emplace_back(0);

NSString* vertPath = [NSString stringWithCString:vertSource.data() encoding:[NSString defaultCStringEncoding]];
MTLLibrary* vertLibrary = [device newLibraryWithSource:vertPath options:nil error:&err];
[vertPath dealloc];

NSString* fragPath = [NSString stringWithCString:fragSource.data() encoding:[NSString defaultCStringEncoding]];
MTLLibrary* fragLibrary = [device newLibraryWithSource:fragPath options:nil error:&err];
[fragPath dealloc];

// Загружаем функцию вершин (vertex function)
MTLFunction* vertexFunction = [vertLibrary newFunctionWithName:@"main0"];

// Загружаем функцию фрагментов (fragment function)
MTLFunction* fragmentFunction = [fragLibrary newFunctionWithName:@"main0"];
```

### Состояние пайплайна

![](https://miro.medium.com/max/1400/1*yd3EKEPedMj3vkIzSCq9Jg.png)

Состояние пайплайна описывает все данные, которые должны быть переданы для успешной отрисовки.

```
// 👋 Объявляем состояние пайплайна
MTLRenderPipelineState* pipelineState;

// ⚗️  Создаем дексриптор пайплайна
MTLRenderPipelineDescriptor* pipelineStateDescriptor = [[MTLRenderPipelineDescriptor alloc] init];
pipelineStateDescriptor.label = @"Simple Pipeline";
pipelineStateDescriptor.vertexFunction = vertexFunction;
pipelineStateDescriptor.fragmentFunction = fragmentFunction;
pipelineStateDescriptor.colorAttachments[0].pixelFormat = layer.pixelFormat;

// 🔣 Собираем все входные данные пайплайна
MTLVertexDescriptor* vertexDesc = [MTLVertexDescriptor vertexDescriptor];
vertexDesc.attributes[0].format = MTLVertexFormatFloat3;
vertexDesc.attributes[0].offset = 0;
vertexDesc.attributes[0].bufferIndex = 0;
vertexDesc.attributes[1].format = MTLVertexFormatFloat3;
vertexDesc.attributes[1].offset = sizeof(float) * 3;
vertexDesc.attributes[1].bufferIndex = 0;
vertexDesc.layouts[0].stepFunction = MTLVertexStepFunctionPerVertex;
vertexDesc.layouts[0].stride = sizeof(Vertex);
pipelineStateDescriptor.vertexDescriptor = vertexDesc;

NSError* error = nil;
// 🌟 Создаем состояние пайплайна
pipelineState = [device
    newRenderPipelineStateWithDescriptor:pipelineStateDescriptor
    error:&error];
if (!pipelineState)
{
  NSLog(@"Failed to created pipeline state, error %@", error);
}
```

## Рендеринг

![](https://miro.medium.com/max/640/1*RT3EXH5610l1rPFqN4k9-Q.png)

```
// 🤵 Создаем renderPassDescriptor с помощью текстур view
CAMetalDrawable* drawable = layer.nextDrawable;

MTLRenderPassDescriptor* renderPassDescriptor = [MTLRenderPassDescriptor renderPassDescriptor];
renderPassDescriptor.colorAttachments[0].texture = drawable.texture;
renderPassDescriptor.colorAttachments[0].loadAction = MTLLoadActionClear;

MTLClearColor clearCol;
clearCol.red = 0.2;
clearCol.green = 0.2;
clearCol.blue = 0.2;
clearCol.alpha = 1.0;
renderPassDescriptor.colorAttachments[0].clearColor = clearCol;
```

### Буфер команд

![](https://miro.medium.com/max/1400/1*xTPP0nduXL0U64dnkO08HA.png)

Буферы команд содержат все команды отрисовки, которые вы собираетесь выполнить, и после того, как вы закончили задавать необходимые команды, они могут быть отправлены в GPU. В этом смысле буфер команд аналогичен обратному вызову, который выполняет функции отрисовки на GPU после того, как он был отправлен в очередь.

```
// 👋 Объяляем буфер команды
MTLCommandBuffer* commandBuffer;
unsigned viewportSize[2];
if (commandBuffer != nil)
  { [commandBuffer release]; }
  mCommandBuffer = [(commandQueue commandBuffer];
  (commandBuffer).label = @"MyCommand";
  
  if(renderPassDescriptor != nil)
  {
    // Создаем renderEncoder и задаем все необходимые данные для отрисовки
    id<MTLRenderCommandEncoder> renderEncoder =
    [commandBuffer renderCommandEncoderWithDescriptor:renderPassDescriptor];
    renderEncoder.label = @"MyRenderEncoder";

    // Задаем область для отрисовки
    [renderEncoder setViewport:(MTLViewport){0.0, 0.0, static_cast<float>(viewportSize[0]), static_cast<float>(viewportSize[1]), 0.1, 1000.0 }];

    [renderEncoder setRenderPipelineState: pipelineState];
    [renderEncoder setCullMode:MTLCullModeNone];
    [renderEncoder setVertexBuffer:positionBuffer offset:0 atIndex:0];
    [renderEncoder setVertexBuffer:colorBuffer offset:0 atIndex:1];
    [renderEncoder setVertexBuffer:uniformBuffer offset:0 atIndex:2];
    [renderEncoder drawIndexedPrimitives:MTLPrimitiveTypeTriangle indexCount:3 indexType:MTLIndexTypeUInt32 indexBuffer:indexBuffer indexBufferOffset:0];
    [renderEncoder endEncoding];

    [commandBuffer presentDrawable:drawable];
    [commandBuffer commit];
}
```

### Освобождение ресурсов

Напоминаю, что в [Objective C++ вы должны освободить из памяти объекты, которые создали](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/MemoryMgmt/Articles/mmRules.html#//apple_ref/doc/uid/20000994-BAJHFBGH). Однако, этот кусок кода не нужен, если вы используете автоматический подсчет ссылок (ARC) с помощью [@autoreleasepool](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/MemoryMgmt/Articles/mmAutoreleasePools.html).

```
void destroyAPI()
{
  if (commandBuffer != nil)
  {
    [commandBuffer release];
  }
  
  [commandQueue release];
  
  [device release];
}
void destroyResources()
{
  [fragmentFunction release];
  [vertexFunction release];
  
  [vertLibrary release];
  [fragLibrary release];
  [positionBuffer release];  
  [colorBuffer release];
  [indexBuffer release];
  [uniformBuffer release];
  
  [pipelineState release];
}
```

## Резюме

Metal, пожалуй, самый простой в использовании API современной компьютерной графики с разумными настройками по умолчанию и интуитивно понятным API, который легко ложится на современные GPU.

Ниже ресурсы и ссылки для более глубокого изучения Metal API:
* Официальная документация [Metal](https://developer.apple.com/documentation/metal)
* [Доклады WWDC, в которых обсуждались передовые методы работы с Metal](https://developer.apple.com/videos/graphics-and-games/metal).
* [Джени Клейтон](http://redqueencoder.com/) написала [Metal Programming Guide: Tutorial and Reference via Swift](https://play.google.com/store/books/details?pcampaignid=books_read_action&id=A55BDwAAQBAJ), практическое руководство по Metal API.
* [Мариус Хорга](https://github.com/mhorga) работал над MetalKit.org, коллекцией примеров для Metal.
* Книга Уоррена Мура ([@warrenm](https://twitter.com/warrenm)) [«Metal в примерах»](https://metalbyexample.com/) и [примеры](https://github.com/metal-by-example/sample-code).

Вы найдете весь исходный код, описанный в этом посте, в [репозитории Github здесь](https://github.com/alaingalvan/raw-metal).
