from kerastuner import RandomSearch
from tensorflow.keras import utils
from tensorflow.keras.datasets import mnist
from tensorflow.keras.layers import Dense
from tensorflow.keras.models import Sequential

(x_train, y_train), (x_test, y_test) = mnist.load_data()

x_train = x_train.reshape(60000, 784)
x_test = x_test.reshape(10000, 784)

x_train = x_train / 255
x_test = x_test / 255

y_train = utils.to_categorical(y_train, 10)
y_test = utils.to_categorical(y_test, 10)


def build_model(hp):
    model = Sequential()
    activation_choice = hp.Choice('activation', values=['relu', 'sigmoid', 'tanh', 'elu', 'selu'])

    model.add(
        Dense(
            units=hp.Int('units_input', min_value=512, max_value=1024, step=32),
            input_dim=784,
            activation=activation_choice
        )
    )

    model.add(Dense(units=hp.Int('units_hidden', min_value=128, max_value=800, step=32), activation=activation_choice))
    model.add(Dense(10, activation='softmax'))

    model.compile(
        optimizer=hp.Choice('optimizer', values=['adam', 'rmsprop', 'SGD']),
        loss='categorical_crossentropy', metrics=['accuracy']
    )

    return model


tuner = RandomSearch(
    build_model,
    objective='val_accuracy',
    max_trials=336,
    directory='test_directory'
)

tuner.search_space_summary()
tuner.search(x_train, y_train, batch_size=256, epochs=70, validation_split=0.1)

tuner.results_summary()

models = tuner.get_best_models(num_models=3)

for m in models:
    m.summary()
#    m.evaluate(x_test, y_test)
#    print()

top = tuner.get_best_models(num_models=1)[0]
history = top.fit(
    x_train, y_train, batch_size=256, epochs=70,
    validation_split=0.1, verbose=1
)

scores = top.evaluate(x_test, y_test, verbose=1)
print("Score: ", round(scores[1] * 100, 4))
top.save('nums_top_model.h5')

