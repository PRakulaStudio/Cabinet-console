(function () {

    if (!window.pms) window.pms = {};
    if (!window.pms.plugin) window.pms.plugin = {};
    if (!window.pms.plugin.SecArgonia) window.pms.plugin.SecArgonia = {};
    if (!window.pms.plugin.SecArgonia.cabinet) window.pms.plugin.SecArgonia.cabinet = {};
   
    let cabinet = pms.plugin.SecArgonia.cabinet;
    let template = cabinet.template =
        '<link rel="stylesheet" media="all" href="https://rawgit.com/PRakulaStudio/Cabinet-console/master/basket.css"/>\n' +
        '<link rel="stylesheet" media="all" href="https://rawgit.com/PRakulaStudio/Cabinet-console/master/media.css"/>\n' +
        '    <div class="editor-container">\n' +
        '        <div id="controls-menu" class="horizontal-flex-menu">\n' +
        '            <div class="flex-left">\n' +
        '                <div class="menu-button-section hide-on-mobile">\n' +
        '                    <button style="display: none" class="goBack">Назад</button>\n' +
        '                </div>\n' +
        '                <div class="menu-button-section">\n' +
        '                    <button style="display: none" data-control-button="sendPayment"><span class="button-icon">✉</span>\n' +
        '                        Отправить счет\n' +
        '                    </button>\n' +
        '                </div>\n' +
        '                <div class="menu-button-section">\n' +
        '                    <button style="display: none" data-control-button="sendMail"><span class="button-icon">✉</span>\n' +
        '                        Отправить корзину\n' +
        '                    </button>\n' +
        '                </div>\n' +
        '                <div style="text-overflow: ellipsis;margin-left: 1rem;"><span>/ </span><span>Заказы</span>\n' +
        '                </div>\n' +
        '                <div class="status-container" style="text-overflow: ellipsis;margin-left: 1rem; display: none;">\n' +
        '                    <span>Статус:</span>\n' +
        '                    <div class="status-select">\n' +
        '                        <select  class="statuses">\n' +
        '                            <option value="0">Новый</option>\n' +
        '                            <option value="0">Новый</option>\n' +
        '                            <option value="0">Новый</option>\n' +
        '                            <option value="0">Новый</option>\n' +
        '                            <option value="0">Новый</option>\n' +
        '                        </select>\n' +
        '                    </div>\n' +
        '                </div>\n' +
        '            </div>\n' +
        '            <div class="flex-right hide-on-mobile">\n' +
        '\n' +
        '            </div>\n' +
        '        </div>\n' +
        '        <div id="element-wrapper" style="height: calc(100% - 3rem);position: relative;">\n' +
        '\n' +
        '        </div>\n' +
        '    </div>';
   
    cabinet.orderId = 0;
    cabinet.apiPath = '/system/plugins/SecArgonia/cabinet/';

   // cabinet.requestGetOrder(1);


   cabinet.paymentMethods = {
      'payment':"Счет", "card":"Карта"
   };

    cabinet.statuses = [
        {'id' : 0, 'text' : 'Новый заказ' , 'en' : 'new' , 'color' : 'blue'},
        {'id' : 1, 'text' : 'В обработке' , 'en' : 'waiting' , 'color' : 'blue'},
        {'id': 2, 'text': 'Обработан', 'en': 'confirmed' , 'color': '#00B90E'},
        {'id': 3, 'text': "Оплачен", 'en': 'paid', 'color': '00B90E'},
        {'id': 4, 'text': "Отгружен", 'en': 'sent', 'color': '00B90E'}
    ];




    // TODO: Обработчик рабочего пространства, тут мы подготавливаем верстку и первичное наполенение в зависимости от полученных параметров
    cabinet.workspaceGenerator = function (parameters = false) {
        return new Promise(function (resolve, reject) {
            console.log(parameters);
          //  createNotification(pms.config.name, '<p>Плагин "Кабинет" временно недоступен!</p><br><p>Идет процесс обновления плагина на вашм сайте.</p>', pms.config.icon);
            if(!parameters || !parameters.pageId)
                return resolve({status: false});

            pms.workspace.wrapper.innerHTML = cabinet.template;




            switch (parameters.pageId)
            {
                case 'orders':
                    return  cabinet.requestlistOrders().then(function (result) {
                        return resolve({status:result});
                    });
                break;
                default:
                    return resolve({status: false});
                break;

            }
        });
    };

    cabinet.workspaceLoader = function(){
        let template = '';
    };

    // TODO: Обработчик клика по элементу в меню, вызывается только при клике по элементу с типом "group" и отдает массив вложенных элементов
    cabinet.menuItemsWorker = function (parameters = {}) {
        console.log("ITEM WORKER");
       // return new Promise(function (resolve, reject) {
            //createNotification(pms.config.name, '<p>Плагин "Кабинет" временно недоступен!</p><br><p>Идет процесс обновления плагина на вашм сайте.</p>', pms.config.icon);
            parameters.pageId = 'orders';

        return [
                {
                    id: 'plugin-cabinet-orders',
                    title: 'Все заказы',
                    type: 'item',
                    parameters: parameters
                }
            ];
       // });
    };

    cabinet.requestlistOrders = function () {
        let data = {'order_id':35};
        return io('console/host/pluginRequest', {
            hostId: pms.selectedHost.id,
            requestPath: cabinet.apiPath + '/test.php'
	    //requestPath: cabinet.apiPath +'console/order/listAll'
        }, data).then(function (response) {
            if (!response.status || !response.response) return false;
            cabinet.showOrders(response.response);
        });

    };

    cabinet.showOrders = function(response) {
        console.log(response);
        if(!response || !response.status) return false;
        if(!response.data || !response.data.orders) return false;        //INIT

        let options = "";
        cabinet.statuses.forEach( function(currentValue, index, array){
            options += "<option value='"+currentValue.id+"' data-en='"+currentValue.en+"' data-color='"+currentValue.color+"'>"+currentValue.text+"</option>";
        });
        document.querySelector('.status-select select').innerHTML = options;

        //INIT END
        cabinet.hideOrderButtons();


        let orders = response.data.orders;
        let renderedOrders = [];
        for(let key in orders) {
            renderedOrders[key] =
                '                    <div class="order">\n' +
                '                        <div class="order-id"><span>'+orders[key].id+'</span></div>\n' +
                '                        <div class="order-sum">'+formatMoney(orders[key].total)+'</div>\n' +
                '                        <div class="order-status">'+cabinet.statuses[orders[key].status].text+'</div>\n' +
                '                        <div class="order-date">'+orders[key].date+'</div>\n' +
                '                        <div class="order-edit"><a href="#" data-id="'+orders[key].id+'">Открыть</a></div>\n' +
                '                        <div class="order-delete" data-id="'+orders[key].id+'">x</div>\n' +
                '</div>';
        }

        document.querySelector('div#element-wrapper').innerHTML = '<div class="orders">\n'
            + renderedOrders.join('') +
            '        </div>';
        return true;
    };

    cabinet.hideOrderButtons = function () {
        document.querySelector('button.goBack').style.display = 'none';
        document.querySelector('div.status-container').style.display = 'none';
        document.querySelector('button[data-control-button="sendMail"').style.display = 'none';
        document.querySelector('button[data-control-button="sendPayment"').style.display = 'none';

    };

    cabinet.showOrderButtons = function() {
        document.querySelector('button.goBack').style.display = 'block';
        document.querySelector('div.status-container').style.display = 'flex';
        document.querySelector('button[data-control-button="sendMail"').style.display = 'block';
        document.querySelector('button[data-control-button="sendPayment"').style.display = 'block';

    };


    //Запрос вывода всех заказов
    //Вывод одного заказа
    //--Запрос вывода одного заказа
    cabinet.requestGetOrder = function (order_id) {
        let data = {'order_id': order_id};

      //  data.append('order_id', order_id);
        return io('console/host/pluginRequest', {
            hostId: pms.selectedHost.id,
            requestPath: cabinet.apiPath +'console/order/get',
            mode:'post'
        }, data).then(function (response) {
            if (!response.status || !response.response) return false;
            cabinet.showOrder(response.response);
        });



    };
    //--Заполнение шаблона заказа и вывод на страницу
    cabinet.showOrder = function(response) {
        if(!response || !response.status) return false;

        let order = {};
        let products = {};
        cabinet.showOrderButtons();

        if(response.data.order) order = response.data.order;
        cabinet.orderId = order.id;
        if(order.products) products = order.products;
        let status = order.status;
        let header = '<div class="basket-container" style="display: block;">' +
                        '<div class="basket-box">';
        let output = null;



        document.querySelector('select.statuses').value = status;



     //   let userData = cabinet.getUser(order.user_id);
        let footer = '  </div>\n' +
            '\n' +
            '            <div class="basket-total">\n' +
            '                <div>\n' +
            '                    <p>Использовано бонусов: <span>'+formatMoney(order.used_bonus)+'</span></p>\n' +
            '                </div>\n' +
            '\n' +
            '                <div>\n' +
            '                    <button action="use-bonus">Использовать бонусные рубли</button>\n' +
            '                </div>\n' +
            '\n' +
            '                <div>\n' +
            '                    <p>Итого: <span>'+formatMoney(order.total)+'</span></p>\n' +
            '                </div>\n' +
            '            </div>\n' +
            '\n' +
            '            <div class="payment-box">\n' +
            '                <p>Вариант оплаты: '+cabinet.paymentMethods[order.payment_method]+'</p>\n' +
            '            </div>\n';
        let renderedProducts = [];
        for(let key in products){
            renderedProducts[key] = renderProduct(products[key]);
        }
        output = renderedProducts.join('');

        cabinet.getUserAttributes(order.user_id).then(function (userData) {

            document.querySelector('div#element-wrapper').innerHTML = header + output + footer + userData;
        });



    };

    cabinet.getUserAttributes = function(user_id) {
         return cabinet.requestGetUser(user_id).then(function (response) {
            if(!response) return false;
            return'\n' +
                '            <div class="address-box">\n' +
                '                <p>Текущий адрес доставки: '+response.index_number+
                ' '+response.delivery_city+
                ' '+response.address+'</p>\n' +
                '            </div>\n' +
                '            <div class="address-box">\n' +
                ' <p>Имя: '+response.name+'</p>\n' +
                ' <p>Email: '+response.mail+'</p>\n' +
                ' <p>Телефон: '+response.phone+'</p>\n' +
                '            </div>\n' +
                '            <div class="address-box">\n' +
                '                <p>Реквизиты:</p>\n' +
                ' <p>ИНН: '+response.inn+'</p>\n' +
                ' <p>Имя организации: '+response.name_organization+'</p>\n' +
                ' <p>ОГРН: '+response.ogrn+'</p>\n' +
                ' <p>Банк: '+response.name_bank+'</p>\n' +
                ' <p>БИК: '+response.bik+'</p>\n' +
                ' <p>Корреспонденский счет: '+response.correspondent_account+'</p>\n' +
                ' <p>Расчетный счет: '+response.checking_account+'</p>\n' +
                '            </div>\n' +
                '\n' +
                '            <div class="basket-liner"></div>';
        });

    };

    cabinet.requestGetUser = function (user_id) {

        let data = {'user_id': user_id};

        return io('console/host/pluginRequest', {
            hostId: pms.selectedHost.id,
            requestPath: cabinet.apiPath +'console/user/get',
            mode:'post'
        }, data).then(function (response) {

            if (!response.status || !response.response) return false;
            return response.response.userData ? response.response.userData : false;
        });


    };

    function renderProduct(p) {
        let modifications = p.modifications;
        let order_id = p.order_id;
        let product = p.product;
        let totalPrice = p.total_price;
        let status = p.status;

        let outputModifications = "";
        for(let k in modifications) {
            outputModifications += renderModification(modifications[k]);
        }



        return '<div class="basket-product" data-id-item="'+ product.id +'">\n' +
            '                    <div>\n' +
            '                        <div>\n' +
            '                            <div>\n' +
            '                                <div><img src="https://cottonbaby.ru'+product.images[0]['50x50']+'">\n' +
            '                                    <div><p>#'+ order_id +'</p>\n' +
            '                                        <p><a href="'+product.href+'">'+ product.title +'</a></p>' +
            '                                        <p>Коллекция: <a href="#"></a></p></div>\n' +
            '                                </div>\n' +
            '                            </div>\n' +
            '                            <div>\n' +
            '                                <div><p>Цена за шт.</p><span> '+formatMoney(product.price)+'</span></div>\n' +
            '                            </div>\n' +
            '                        </div>\n' +
            '                        <div>\n' +
            '                            <div>\n' + outputModifications +
            '                            </div>\n' +
            '                            <div>\n' +
            '                                <div><p>Сумма</p><span>'+ formatMoney(totalPrice) +'</span></div>\n' +
            '                            </div>\n' +
            '                        </div>\n' +
            '                    </div>\n' +
            '                    <div>\n' +
            '                        <button data-action="remove">x</button>\n' +
            '                    </div>\n' +
            '                </div>';




    }

    function renderModification(modification) {

        let show_mods = modification.quantity != 0 ? 'basket-size-on' : '';
       return '<div data-id-size="'+modification.id+'" class="'+show_mods+'"><p>'+modification.title+'</p>\n' +
            '<div>\n' +
            '<button data-action-size="reduce">-</button>\n' +
            '<input type="number" placeholder="0" class="shest" value="'+modification.quantity+'">\n' +
            '<button data-action-size="increase">+</button>\n' +
            '</div>\n' +
            '</div>\n';


    }

    //--Событие редактирования кол-ва модификаторов
    //--Вывод ответа
    cabinet.requestEdit = function(product_id)
    {
      	let data = {};

      	document.querySelectorAll('div.basket-box div[data-id-item="'+product_id+'"] input[type="number"]').forEach( function(currentValue, index, array){
      		data[currentValue.closest('div[data-id-size]').getAttribute('data-id-size')] = currentValue.value == "" ? 0 : currentValue.value;
      	});
        let requestData = {
            'order_id': cabinet.orderId,
            'product_id': product_id,
            'modifications': JSON.stringify(data)
        };

        return io('console/host/pluginRequest', {
            hostId: pms.selectedHost.id,
            requestPath: cabinet.apiPath +'console/order/edit',
            mode:'post'
        }, requestData).then(function (response) {

            if (!response.status || !response.response) return false;
            cabinet.editOrder(response.response);
        });
    };
    cabinet.editOrder = function(response)
    {
        if (!response || !response.status) return false;
        let product = response.data.product;
        for(let key in product)
        {
            document.querySelectorAll('div.basket-box div[data-id-item="'+key+'"] span')[1].innerHTML = formatMoney(product[key].price_total);
        }
        document.querySelectorAll('div.basket-total div')[2].querySelectorAll('span')[0].innerHTML = formatMoney(response.data.total_price);
        return true;
    };





    //функция, переводящая строку в денежный формат
    function formatMoney(number) {
        let format = number.toString().split(""),
            money = [],
            iterator = 1;

        for (let key = format.length - 1; key >= 0; key--) {
            if (iterator > 0 && iterator % 3 == 0) {
                money[key] = " " + format[key];
                iterator++;
                continue;
            }

            money[key] = format[key];
            iterator++;
        }

        return money.join('') + " руб.";
    }

   
    function changeNewTotalPrice(input)
    {
    	
    	let price = parseInt( (input.closest('div.basket-product').querySelectorAll('span')[0].innerHTML).replace('руб.', "").replace(/\s*/g,'') ) ;
    	
    	let totalPrice = 0;
    	input.closest('div[data-id-size]').parentNode.querySelectorAll('div[data-id-size] input[type="number"] ').forEach( function(currentValue, index, array){
    	 	totalPrice += price * parseInt( currentValue.value );
    	});

    	if( totalPrice === 0)
    		totalPrice = price;

        input.closest('div.basket-product').querySelectorAll('span')[ input.closest('div.basket-product').querySelectorAll('span').length - 1].innerHTML = formatMoney(totalPrice);

        totalPrice = 0;

        document.querySelectorAll('div.basket-product').forEach( function(currentValue, index, array){
        	totalPrice += parseInt( (currentValue.querySelectorAll('span')[ currentValue.querySelectorAll('span').length - 1].innerHTML).replace('руб.', "").replace(/\s*/g,'')  );
        });
    	
    	// total_price = totalPrice - useBonus; бонусы не нужны
    	document.querySelectorAll('div.basket-total div')[2].querySelector('span').innerHTML = formatMoney(totalPrice);
 	
 	    // $('div.basket-order').find('div').eq(1).find('p').eq(0).text("Сумма вашего заказа состовляет "+formatMoney(total_price)) //тоже не надо

 	    // checkButtonOrder(); не нужно


       

    }
   
    //событие на изменение кол-ва размеров для товара
    let timeOuts = [];

    function eventChangeModification(event)
    {
    	let id_item = event.target.closest('div.basket-product').getAttribute('data-id-item'); //необходим полифилл для ие
    	           
        if( event.target.parentNode.querySelector('input').value > 0)
           	event.target.parentNode.closest('div[data-id-size]').classList.add('basket-size-on');
        else
           	event.target.parentNode.closest('div[data-id-size]').classList.remove('basket-size-on');

        changeNewTotalPrice( event.target.parentNode.querySelector('input') );

        timeOuts[event.target.closest('div.basket-product').getAttribute('data-id-item')] = setTimeout(function() {
              cabinet.requestEdit(id_item);
        }, 1000 );
             /*
    	     changeNewTotalPrice( $(this).siblings('input'))
     		*/
    }

    function eventDeleteItem()
    {
    	let product_id = event.target.closest('div.basket-product').getAttribute('data-id-item'); 
    	//var requestData = new FormData();
    	//requestData.append('product_id' , product_id);
    	//requestData.append('order_id' , cabinet.orderId );

    	let requestData = {
    	    'product_id': product_id,
            'order_id': cabinet.orderId
        };

        return io('console/host/pluginRequest', {
            hostId: pms.selectedHost.id,
            requestPath: cabinet.apiPath +'console/order/deleteItem',
            mode:'post'
        }, requestData).then(function (response) {

            if (!response.status || !response.response) return false;
            if(response.response.status)
            {
                document.querySelector('div.basket-box div[data-id-item="'+product_id+'"]').remove();
                document.querySelectorAll('div.basket-total div')[document.querySelectorAll('div.basket-total div').length - 1].querySelector('span').innerHTML = formatMoney(response.response.data.total_price);

            }
        });
    }


    function requestSendOrder(order_id)
    {
        let data = {'order_id': order_id};

        return io('console/host/pluginRequest', {
            hostId: pms.selectedHost.id,
            requestPath: cabinet.apiPath +'console/order/sendpayment',
            mode:'post'
        }, data).then(function (response) {
            if (!response.status || !response.response) return false;
            if(response.response.status)
            {
                alert('Счет отправлен клиенту!');
            }
        });
       /* return fetch(cabinet.apiPath +'console/order/sendpayment', {method: 'POST', credentials: 'same-origin', body: data })
            .then(function (response) {
                let responseData = false;
                try {
                    responseData = response.json();
                    cabinet.orderId = order_id;
                }
                catch (e) {
                    responseData = {status: false, statusText: "Произошла ошибка при соединении"};
                    response.text().then(console.debug);
                }

                return responseData;
            })
            .then(function (response) {
                if( response.status )
                    alert('Счет отправлен клиенту!');
            });*/



    }

    function requestSendMail(order_id)
    {
        let data = {'order_id': order_id};

        return io('console/host/pluginRequest', {
            hostId: pms.selectedHost.id,
            requestPath: cabinet.apiPath +'console/order/sendchanged',
            mode:'post'
        }, data).then(function (response) {
            if (!response.status || !response.response) return false;
            if(response.response.status)
            {
                alert('Счет отправлен клиенту!');
            }
        });

       /* return fetch(cabinet.apiPath +'console/order/sendchanged', {method: 'POST', credentials: 'same-origin', body: data })
            .then(function (response) {
                let responseData = false;
                try {
                    responseData = response.json();
                    cabinet.orderId = order_id;
                }
                catch (e) {
                    responseData = {status: false, statusText: "Произошла ошибка при соединении"};
                    response.text().then(console.debug);
                }

                return responseData;
            })
            .then(function (response) {
                if( response.status )
                    alert('Счет отправлен клиенту!');
            });*/



    }

    function requestChangeStatus(status_id)
    {
        let data = {
            'order_id': cabinet.orderId,
            'status': status_id
        };

        return io('console/host/pluginRequest', {
            hostId: pms.selectedHost.id,
            requestPath: cabinet.apiPath +'console/order/setstatus',
            mode:'post'
        }, data).then(function (response) {
            if (!response.status || !response.response) return false;
            if(response.response.status)
            {
                alert('Статус изменен!');
            }
        });

     



    }

    document.querySelectorAll('body')[0].addEventListener('change', function (event) {
        if(event.target.tagName == "SELECT" && event.target.classList.contains('statuses')){
            requestChangeStatus(event.target.value);
        }
    });
    


    document.querySelectorAll('body')[0].addEventListener('click' , function(event) {
    	if(event.target.tagName == "BUTTON" && event.target.hasAttribute('data-action-size'))
    	{
            let id_item = event.target.closest('div.basket-product').getAttribute('data-id-item'); //необходим полифилл для ие
            clearTimeout(timeOuts[id_item]);

            if(event.target.getAttribute('data-action-size') == "increase" )
                  event.target.parentNode.querySelector('input').value = parseInt(event.target.parentNode.querySelector('input').value) + 1;
            else
                  event.target.parentNode.querySelector('input').value = parseInt(event.target.parentNode.querySelector('input').value) - 1 < 0 ? 0 : parseInt( event.target.parentNode.querySelector('input').value ) - 1;
    		eventChangeModification(event)
      
            return;
     	}

        if(event.target.tagName == "BUTTON" && event.target.getAttribute('data-control-button') == "sendPayment")
        {
            requestSendOrder( cabinet.orderId);

            return;
        }

        if(event.target.tagName == "BUTTON" && event.target.getAttribute('data-control-button') == "sendMail")
        {
            requestSendMail( cabinet.orderId);
            return;
        }
    	

    	if(event.target.tagName == "BUTTON" && event.target.getAttribute('data-action') == "remove")
    	{
    		eventDeleteItem();
            return;
    	}
     
        if(event.target.tagName == "A" && event.target.hasAttribute('data-id') )
        {
            cabinet.requestGetOrder(event.target.getAttribute('data-id'));
            return;
        }

        if(event.target.tagName == "BUTTON" && event.target.classList.contains('goBack'))
        {
            cabinet.requestlistOrders();
            return;
        }

            

    	
    });


    document.querySelectorAll('body')[0].addEventListener('keyup' , function(event){
    	if(event.target.tagName == "INPUT" && event.target.getAttribute('type') == "number")
    	{      
            let id_item = event.target.closest('div.basket-product').getAttribute('data-id-item'); //необходим полифилл для ие
            clearTimeout(timeOuts[id_item]);
            if(event.target.value.length > 3)
                event.target.value = event.target.value.substr( 0, 3 );
            if( event.target.value == "")
                event.target.value = 0;    
            eventChangeModification(event);
          
  
	   	}

    });



})();
